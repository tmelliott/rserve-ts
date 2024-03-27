import { describe, expect, it } from "vitest";
import Robj, { type RObject } from "./Robj";
import { my_ArrayBufferView } from "./ArrayBufferView";

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
      value: RObject<any, any>;
    };

const num: Payload = {
  type: "int",
  value: 1,
};

const x1 = Robj.double_array(new Float64Array([1, 2, 3]));

const x: Payload = {
  type: "sexp",
  value: Robj.vector([
    Robj.double_array(new Float64Array([1, 2, 3])),
    Robj.string_array(["one", "two", "three"]),
    Robj.int_array(new Int32Array([1, 2, 1]), {
      type: "tagged_list",
      value: [
        {
          name: "levels",
          value: Robj.string_array(["one", "two"]),
        },
      ],
    }),
  ]),
};

x.value.json();
