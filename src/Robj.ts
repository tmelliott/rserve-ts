export type Attributes = {
  type: string;
  value: Rvalue<any>[]; //(RObject<any> & { name: string })[];
};

type Rvalue<T> = {
  name: string;
  value: RObject<T>;
};

// always (?) the 'resolve_hash' function, which returns the object stored in 'captured_functions'
type Resolver = (value: string) => string;

// partial inference problem....

// make_basic<"vector", RObject<any>[]>((x) => {x.value})

const make_basic = <T extends string, V>(
  proto?: <R>(this: RObject<T>, resolver: Resolver) => R
) => {
  const wrapped_proto = {
    json: function (this: RObject<T>, resolver?: Resolver) {
      if (!proto) {
        throw new Error("json() unsupported for type " + this.type);
      }
      const result = proto.call(this, resolver ?? ((x) => x)) as ReturnType<
        typeof proto
      > & {
        r_type: string;
        r_attributes?: {
          [key: string]: any;
        };
      };
      result.r_type = this.type;
      if (this.attributes) {
        result.r_attributes = Object.fromEntries(
          this.attributes.value.map((v) => [v.name, v.value.json(resolver)])
        );
      }
      return result;
    },
  };

  return function (v: V, attrs: RObject<"tagged_list">) {
    const result = new RObject(type, v, attrs, wrapped_proto.json);
    return result;
  };
};

// type Json<T = any> = (this: RObject<T>, resolver?: Resolver) => any;

// TODO: infer this from final object?
type Rtypes =
  | "vector"
  | "symbol"
  | "list"
  | "lang"
  | "tagged_list"
  | "tagged_lang"
  | "vector_exp"
  | "int_array"
  | "double_array"
  | "string_array"
  | "bool_array"
  | "raw"
  | "string"
  | "clos"
  | "null";

export class RObject<T extends string, U = {}> {
  type: T;
  value: U; // infer from T
  attributes?: RObject<"tagged_list">;
  json: any;

  constructor(
    type: T,
    value: U,
    attributes?: RObject<"tagged_list">,
    json?: any
  ) {
    this.type = type;
    this.value = value;
    this.attributes = attributes;
    this.json = json;
  }
}

export const Robj = {
  null: (attributes: Attributes) => ({
    type: "null",
    value: null,
    attributes: attributes,
    json: () => null,
  }),
  clos: (formals: any, body: any, attributes: Attributes) => ({
    type: "clos",
    value: { formals, body },
    attributes: attributes,
    json: () => {
      throw new Error("json() unsupported for type clos");
    },
  }),
  // these could be lists of different things, e.g., lm() output, or a data.frame ...
  // RObject<[RObject<number[]>, RObject<string[]>, ...]>
  vector: make_basic<"vector", RObject<any>[]>(function (resolver?: Resolver) {
    const values = this.value.map((x) => x.json(resolver));
    if (!this.attributes) return values;
    if (this.attributes.value[0].name === "names") {
      const keys = this.attributes.value[0].value.value;
      let result: {
        [key: string]: any;
      } = {};
      keys.map((k: string, i: number) => {
        result[k] = values[i];
      });
      return result;
    }
    return values;
  }),
  symbol: make_basic("symbol", function <T extends {}>(this: RObject<T>) {
    return this.value;
  }),
  list: make_basic("list"),
  lang: make_basic("lang", function (this, resolver: Resolver) {
    const values = this.value.map((x) => x.json(resolver));
    if (!this.attributes) return values;
    // FIXME: lang doens't have "names" attribute since
    //        names are sent as tags (langs are pairlists)
    //        so this seems superfluous (it is dangerous
    //        if lang ever had attributes since there is
    //        no reason to fail in that case)
    if (this.attributes.value[0].name !== "names") {
      throw new Error("expected names here");
    }
    const keys = this.attributes.value[0].value.value;
    let result: {
      [key: string]: any;
    } = {};
    keys.map((k: string, i: number) => {
      result[k] = values[i];
    });
    return result;
  }),
  tagged_list: make_basic(
    "tagged_list",
    function (this: RObject<Rvalue<any>[]>, resolver: Resolver) {
      const classify_list = (list: Rvalue<any>[]) => {
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
    }
  ),
  tagged_lang: make_basic(
    "tagged_lang",
    function (this: RObject<Rvalue<any>[]>, resolver: Resolver) {
      return this.value.map((x) => [x.name, x.value.json(resolver)]);
    }
  ),
  vector_exp: make_basic("vector_exp"),
  int_array: make_basic("int_array", function (this: RObject<number[]>) {
    if (
      this.attributes &&
      this.attributes.type === "tagged_list" &&
      this.attributes.value[0].name === "levels" &&
      this.attributes.value[0].value.type === "string_array"
    ) {
      const levels = this.attributes.value[0].value.value as string[];
      let arr: string[] & {
        levels?: string[];
      } = this.value.map((factor) => levels[factor - 1]);
      arr.levels = levels;
      return arr;
    } else {
      if (this.value.length === 1) return this.value[0];
      return this.value;
    }
  }),
  double_array: make_basic("double_array", function (this: RObject<number[]>) {
    if (this.value.length === 1 && !this.attributes) return this.value[0];
    return this.value;
  }),
  string_array: make_basic(
    "string_array",
    function (this: RObject<string[]>, resolver: Resolver) {
      if (this.value.length === 1) {
        if (!this.attributes) return this.value[0];
        if (
          this.attributes.value[0].name === "class" &&
          this.attributes.value[0].value.value.indexOf(
            "javascript_function"
          ) !== -1
        ) {
          return resolver(this.value[0]);
        }
        return this.value;
      }
      return this.value;
    }
  ),
  bool_array: make_basic("bool_array", function (this: RObject<boolean[]>) {
    if (this.value.length === 1 && !this.attributes) return this.value[0];
    return this.value;
  }),
  raw: make_basic("raw", function (this: RObject<Uint8Array>) {
    if (this.value.length === 1 && !this.attributes) return this.value[0];
    return this.value;
  }),
  string: make_basic("string", function (this: RObject<string>) {
    return this.value;
  }),
} as const;

export default Robj;
