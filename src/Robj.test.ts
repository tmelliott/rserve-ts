import { describe, expect, it } from "vitest";
import { my_ArrayBufferView } from "./ArrayBufferView";
import Robj from "./Robj";
import { RsrvCommandCode, RsrvXT } from "./Rsrv";

describe("make_basic", () => {
  it("should make a thing", () => {
    expect(1).toBe(1);
  });
});

// here's what an R object should look like ...

// type RValue = number | string | ArrayBuffer | RObject;

// type RObject = {
//   type: string;
//   value: RValue | RValue[];
//   attributes: RValue | undefined;
// };

// class RObject<TValue> {
//   type: string;
//   value: TValue;
//   attributes: any;
//   proto: {
//     json: (
//       this: RObject<TValue>,
//       resolver: (value: string) => string
//     ) => unknown;
//   };

//   constructor(type: string, value: TValue, attributes?: any) {
//     this.type = type;
//     this.value = value;
//     this.attributes = attributes;
//     this.proto = {
//       json: () => {
//         this.value;
//         throw new Error("no json method");
//       },
//     };
//   }

//   setProto<R>(
//     json: (this: RObject<TValue>, resolver: (value: string) => string) => R
//   ) {
//     this.proto = { json };
//   }

//   json(resolver: (value: string) => string) {
//     const result = this.proto.json.call(this, resolver);
//   }
// }

// const myobj = new RObject("double_array", [1, 2, 3], undefined, {
//   json: function (resolver: (value: string) => string) {
//     const x = this.value;
//     return x;
//   },
// });

type RObject<T = {}, R = void> = {
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

    return function (value: TObject, attributes?: any) {
      function r_object(this: RObject<TObject>) {
        this.type = type;
        this.value = value;
        this.attributes = attributes;
      }
      r_object.prototype = proto;
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

type Attributes = {
  type: string;
  value: NamedList<RObject>;
};

type NamedList<T = RObject> = {
  name: string;
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
  vector: make_basic<Array<RObject>>()("vector", {
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
  symbol: make_basic<string>()("symbol", {
    json: function () {
      return this.value;
    },
  }),
  list: make_basic()("list"),
  lang: make_basic<Array<RObject>>()("lang", {
    json: function (resolver?: (value: string) => string) {
      const values = this.value.map((x) => x.json(resolver));
      if (!this.attributes) return values;
      this.attributes.value;

      if (this.attributes.value[0].name !== "names")
        throw new Error("expected named here");

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
  tagged_lang: make_basic<Array<{ name: string; value: RObject }>>()(
    "tagged_lang",
    {
      json: function (resolver?: (value: string) => string) {
        return this.value.map((x) => [x.name, x.value.json(resolver)]);
      },
    }
  ),
  vector_exp: make_basic()("vector_exp"),
  int_array: make_basic<number[]>()("int_array", {
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
        } = this.value.map((factor) => levels[factor - 1]);
        arr.levels = levels;
        return arr;
      } else {
        if (this.value.length === 1) return this.value[0];
        return this.value;
      }
    },
  }),
  double_array: make_basic<number[]>()("double_array", {
    json: function () {
      if (this.value.length === 1 && !this.attributes) return this.value[0];
      return this.value;
    },
  }),
  string_array: make_basic<string[]>()("string_array", {
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
          return resolver(this.value[0]);
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
  string: make_basic<string>()("string", {
    json: function () {
      return this.value;
    },
  }),
};

type Payload =
  | {
      type: "int";
      value: number;
    }
  | {
      type: "string";
      value: string;
    }
  | {
      type: "stream";
      value: ReturnType<typeof my_ArrayBufferView>;
    }
  | {
      type: "sexp";
      value: RObject;
    };

// const num: Payload = {
//   type: "int",
//   value: 1,
// };

// const x1: RObject = {
//   type: "double_array",
//   value: [1, 2, 3],
// };

// const x: Payload = {
//   type: "sexp",
//   value: {
//     type: "vector",
//     value: [
//       {
//         type: "double_array",
//         value: [1, 2, 3],
//       },
//       {
//         type: "string_array",
//         value: ["one", "two", "three"],
//       },
//       {
//         type: "int_array",
//         value: [1, 2, 1],
//         attributes: {
//           type: "tagged_list",
//           value: [
//             {
//               name: "levels",
//               value: {
//                 type: "string_array",
//                 value: ["one", "two"],
//               },
//             },
//           ],
//         },
//       },
//     ],
//   },
// };
