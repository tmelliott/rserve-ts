export type RObject<T = {}, R = void> = {
  type: string;
  value: T;
  attributes?: Attributes;
  json: ProtoFunction<T, R>;
};

type ProtoFunction<T, R> = (
  this: RObject<T>,
  resolver?: (value: string) => string
) => R;

const make_basic =
  <TObject>() =>
  <R>(
    type: string,
    proto?: {
      json: ProtoFunction<TObject, R>;
    }
  ) => {
    // T describes the structure of the value
    // type is the named type of the object

    // wrap the proto json function here
    const wrapped_proto = {
      json: function (
        this: RObject<TObject, R>,
        resolver?: (value: string) => string
      ) {
        if (!proto) throw new Error("json() unsupported for type " + type);

        // if R is an array, then we can add attributes
        const res = proto.json.call(this, resolver);
        if (!Array.isArray(res) && !ArrayBuffer.isView(res)) return res;

        let result = res as R & {
          r_type: string;
          r_attributes?: {
            [key: string]: any;
          };
        };
        result.r_type = type;
        if (this.attributes) {
          result.r_attributes = Object.fromEntries(
            this.attributes.value.map((v) => [v.name, v.value.json(resolver)])
          );
        }
        return result;
      },
    };

    return function (value: TObject, attributes?: any) {
      function r_object(this: RObject<TObject>) {
        this.type = type;
        this.value = value;
        this.attributes = attributes;
      }
      r_object.prototype = wrapped_proto;
      const result: RObject<TObject, R> = new (r_object as any)();
      return result;
    };
  };

const make_number = make_basic<number[]>();
make_number("number", {
  json: function (resolver?: (value: string) => string) {
    return this.value;
  },
});

export type Attributes = {
  type: string;
  value: NamedList<RObject>;
};

export type NamedList<T = RObject> = {
  name: string | null;
  value: T;
}[];

const Robj = {
  null: (attributes?: Attributes) => ({
    type: "null",
    value: null,
    attributes: attributes,
    json: () => null,
  }),
  clos: (formals: any, body: any, attributes?: Attributes) => ({
    type: "clos",
    value: { formals, body },
    attributes: attributes,
    json: () => {
      throw new Error("json() unsupported for type clos");
    },
  }),
  vector: make_basic<RObject<any, any>[]>()("vector", {
    json: function (resolver?: (value: string) => string) {
      const values = this.value.map((x) => x.json(resolver));
      if (!this.attributes) return values;

      if (this.attributes.value[0].name === "names") {
        const keys = this.attributes.value[0].value.value as string[];
        let result: {
          [key: string]: any;
        } = {};
        keys.map((k: string, i: number) => {
          result[k] = values[i];
        });
        return result;
      }
      return values;
    },
  }),
  symbol: make_basic<string | null>()("symbol", {
    json: function () {
      return this.value;
    },
  }),
  list: make_basic()("list"),
  lang: make_basic<Array<RObject>>()("lang", {
    json: function (resolver?: (value: string) => string) {
      const values = this.value.map((x) => x.json(resolver));
      if (!this.attributes) return values;
      if (this.attributes.value[0].name !== "names")
        throw new Error("expected names here");

      // TODO: is it possible to infer attributes type?
      const keys = this.attributes.value[0].value.value as string[];
      let result: {
        [key: string]: any;
      } = {};
      keys.map((k: string, i: number) => {
        result[k] = values[i];
      });
      return result;
    },
  }),
  tagged_list: make_basic<NamedList>()("tagged_list", {
    json: function (resolver?: (value: string) => string) {
      const classify_list = (list: NamedList) => {
        if (list.every((elt) => elt.name === null)) return "plain_list";
        if (list.every((elt) => elt.name !== null)) return "plain_object";
        return "mixed_list";
      };
      const list = this.value.slice(1);
      switch (classify_list(list)) {
        case "plain_list":
          return list.map((x) => x.value.json(resolver));
        case "plain_object":
          return Object.fromEntries(
            list.map((x) => [x.name, x.value.json(resolver)])
          );
        case "mixed_list":
          return list;
        default:
          throw new Error("Internal Error");
      }
    },
  }),
  tagged_lang: make_basic<Array<{ name: string | null; value: RObject }>>()(
    "tagged_lang",
    {
      json: function (resolver?: (value: string) => string) {
        return this.value.map((x) => [x.name, x.value.json(resolver)]);
      },
    }
  ),
  vector_exp: make_basic()("vector_exp"),
  int_array: make_basic<Int32Array>()("int_array", {
    json: function () {
      if (
        this.attributes &&
        this.attributes.type === "tagged_list" &&
        this.attributes.value[0].name === "levels" &&
        this.attributes.value[0].value.type === "string_array"
      ) {
        const levels = this.attributes.value[0].value.value as string[];
        let arr: string[] & {
          levels?: string[];
        } = this.value.reduce<string[]>((acc, x) => {
          acc.push(levels[x - 1]);
          return acc;
        }, []);
        //this.value.map((factor) => levels[factor - 1]);
        arr.levels = levels;
        return arr;
      } else {
        if (this.value.length === 1) return this.value[0];
        return this.value;
      }
    },
  }),
  double_array: make_basic<Float64Array>()("double_array", {
    json: function () {
      if (this.value.length === 1 && !this.attributes) return this.value[0];
      return this.value;
    },
  }),
  string_array: make_basic<(string | null)[]>()("string_array", {
    json: function (resolver?: (value: string) => string) {
      if (this.value.length === 1) {
        if (!this.attributes) return this.value[0];
        if (
          this.attributes.value[0].name === "class" &&
          (this.attributes.value[0].value.value as string).indexOf(
            "javascript_function"
          ) !== -1
        ) {
          if (!resolver) throw new Error("resolver required");
          // TODO: how to handle NA values (null in array)?
          return this.value[0] ? resolver(this.value[0]) : null;
        }
        return this.value;
      }
      return this.value;
    },
  }),
  bool_array: make_basic<boolean[]>()("bool_array", {
    json: function () {
      if (this.value.length === 1 && !this.attributes) return this.value[0];
      return this.value;
    },
  }),
  raw: make_basic<Uint8Array>()("raw", {
    json: function () {
      if (this.value.length === 1 && !this.attributes) return this.value[0];
      return this.value;
    },
  }),
  string: make_basic<string | null>()("string", {
    json: function () {
      return this.value;
    },
  }),
};

export default Robj;
