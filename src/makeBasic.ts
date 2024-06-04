// type BasicObject<T, A extends AttrArray = undefined> = {
//   type: string;
//   value?: T;
//   attributes?: A extends undefined ? undefined : AttrList<A>;
// };

// const makeBasicObject = <T, A extends AttrArray = undefined>(
//   type: string
// ): BasicObject<T, A> => {
//   return {
//     type,
//   };
// };

// // all types are inferred at this point:
// const makeTypedObject = <TObj, TAttr extends AttrArray, R>(
//   obj: BasicObject<TObj, TAttr>,
//   proto?: {
//     json: (
//       this: RObject<TObj, any, TAttr>,
//       resolver?: (value: string) => string
//     ) => R;
//   }
// ) => {
//   if (!proto) {
//     proto = {
//       json: function () {
//         throw new Error("json() unsupported for type " + this.type);
//       },
//     };
//   }

//   const json = proto.json;
//   const wrapped_proto = {
//     json: function (
//       this: RObject<TObj, R, TAttr>,
//       resolver?: (value: string) => string
//     ) {
//       const res = json.call(this, resolver);
//       if (!Array.isArray(res) && !ArrayBuffer.isView(res)) return res;

//       let result = res as WithAttributes<R, TAttr>;
//       result.r_type = obj.type;
//       if (this.attributes) {
//         result.r_attributes = Object.fromEntries(
//           this.attributes.value.map((v) => [v.name, v.value.json()])
//         ) as any;
//       }
//       return result;
//     },
//   };

//   return function <A extends AttrArray>(value: TObj, attributes?: AttrList<A>) {
//     function rObject(this: RObject<TObj, R, A>) {
//       this.type = obj.type;
//       this.value = value;
//       this.attributes = attributes;
//     }
//     rObject.prototype = wrapped_proto;
//     const result = new (rObject as any)() as RObject<TObj, R, A>;
//     return result;
//   };
// };

// export { makeBasicObject, makeTypedObject };

type RAttr = {
  name: string;
  value: any;
};

type AttrArray = ReadonlyArray<RAttr> | undefined;

type AttrList<A extends AttrArray> = A extends undefined
  ? undefined
  : {
      type: "tagged_list";
      value: A;
    };

type WithAttributes<T, A extends AttrArray> = T & {
  r_type: string;
  r_attributes?: A extends undefined
    ? undefined
    : {
        [K in keyof A]: A[K];
      };
};

type RObject<T, A extends AttrArray, R> = {
  type: string;
  value: T;
  attributes?: AttrList<A>;
  json: (
    this: RObject<T, A, R>
  ) => R extends Array<any> | ArrayBufferView ? WithAttributes<R, A> : R;
};

class RObjectProto<T, A extends AttrList<any> = undefined, R = undefined> {
  type: string;
  value?: T;
  attributes?: A;
  json: (this: RObjectProto<T, A, R>) => R;

  constructor(type: string, json?: (this: RObjectProto<T, A, R>) => R) {
    this.type = type;
    this.json = function () {
      throw new Error("json() unsupported for type " + this.type);
    };
  }

  proto<RNew>(json: (this: RObjectProto<T, A, R>) => RNew) {
    return new RObjectProto<T, A, RNew>(this.type, json as any).create();
  }

  create() {
    return function <const ANew extends AttrArray>(
      value: T,
      attributes?: ANew extends undefined ? undefined : AttrList<ANew>
      // attributes?: ANew extends AttrList<
      //   (infer U extends { name: string; value: any })[]
      // >
      //   ? AttrList<U[]>
      //   : undefined
    ) {
      // const json = proto.json;
      const wrapped_proto = {
        json: function (
          this: RObject<T, ANew, R>,
          resolver?: (value: string) => string
        ) {
          const res = this.json.call(this); // json.call(this, resolver);
          if (!Array.isArray(res) && !ArrayBuffer.isView(res)) return res;

          let result = res as WithAttributes<R, ANew>;
          result.r_type = this.type;
          if (this.attributes) {
            result.r_attributes = Object.fromEntries(
              this.attributes.value.map((v) => [v.name, v.value.json()])
            ) as any;
          }
          return result;
        },
      };
      function rObject(this: RObject<T, ANew, R>) {
        this.type = this.type;
        this.value = value;
        this.attributes = attributes;
      }
      rObject.prototype = wrapped_proto;
      const result = new (rObject as any)() as RObject<T, ANew, R>;
      return result;
    };
  }
}

// type GetAttributes<T> = T extends Array<infer U>[] ? U : never;

const make_basic = <T, A extends AttrList<any> = undefined>(type: string) => {
  return new RObjectProto<T, A>(type).proto;
};

const mystring_obj = make_basic<string[]>("string");
const mystring = mystring_obj(function () {
  if (this.value && this.value.length === 1) return this.value[0];
  return this.value;
});
const x = mystring(["hello", "world"], {
  type: "tagged_list",
  value: [
    {
      name: "class",
      value: mystring(["character"]),
    },
  ],
});
x.attributes;
const z = x.json();
if (z) {
  if (Array.isArray(z)) {
    console.log(z.r_attributes?.class);
  }
}
