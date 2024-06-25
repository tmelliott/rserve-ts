import { z } from "zod";
import { RInt32Array } from "./Rserve";

// declare global {
//   interface Int32Array {
//     r_type: "int_array";
//     r_attributes: any;
//   }
//   interface Float64Array {
//     r_type: "double_array";
//     r_attributes: any;
//   }
// }

export const sexp = <
  TType extends string,
  TValue extends z.ZodTypeAny,
  TAttr extends z.ZodTypeAny,
  TJson extends z.ZodTypeAny
>(
  type: TType,
  value: TValue,
  attributes: TAttr,
  json: TJson
) => {
  return z.object({
    type: z.literal("sexp"),
    value: z.object({
      type: z.literal(type),
      value,
      attributes: z.optional(attributes),
      json: z.function().returns(json),
    }),
  });
};

// type WithType<V, T extends string> = V & { r_type: T };

export const numeric = (attr?: z.ZodTypeAny) =>
  sexp(
    "double_array",
    z.instanceof(Float64Array),
    attr ?? z.any(),
    z.union([
      z.number(),
      z
        .instanceof(Float64Array)
        .and(
          z.object({ r_type: z.literal("double_array"), r_attributes: z.any() })
        ),
    ])
  );

export const integer = (attr?: z.ZodTypeAny) =>
  sexp(
    "int_array",
    z.instanceof(Int32Array),
    attr ?? z.any(),
    z.union([
      z.number(),
      z.instanceof(Int32Array).and(
        z.object({
          r_type: z.literal("int_array"),
          r_attributes: z.any(),
        })
      ),
    ])
  );

// class RObject<
//   T extends string,
//   V extends z.ZodTypeAny,
//   A extends z.ZodTypeAny,
//   J extends z.ZodTypeAny
// > {
//   type: T;
//   value: V;
//   attributes: A;
//   jsonValue: J;

//   constructor(type: T) {
//     this.type = type;
//     this.value = {} as V;
//     this.attributes = {} as A;
//     this.jsonValue = {} as J;
//   }

//   get = () => {
//     return z.object({
//       type: z.literal(this.type),
//       value: this.value,
//       attributes: z.optional(this.attributes),
//       // json: z.function(z.tuple([])).returns(this.jsonValue).optional(),
//     });
//   };

//   schema<Vnew extends z.ZodTypeAny>(value: Vnew): RObject<T, Vnew, A, J> {
//     if (value instanceof RObject) {
//       (this as any).value = value.get();
//     } else {
//       (this as any).value = value;
//     }
//     return this as any;
//   }

//   attr<Anew extends z.ZodTypeAny>(value: Anew): RObject<T, V, Anew, J> {
//     (this as any).attributes = value;
//     return this as any;
//   }

//   json<Jnew extends z.ZodTypeAny>(value: Jnew): RObject<T, V, A, Jnew> {
//     (this as any).jsonValue = value;
//     return this as any;
//   }
// }

// function robject<T extends string>(type: T) {
//   return new RObject(type);
// }

// const sexp = <
//   T extends string,
//   V extends z.ZodTypeAny,
//   A extends z.ZodTypeAny,
//   J extends z.ZodTypeAny
// >(
//   value: RObject<T, V, A, J>
// ) => robject("sexp").schema(value.get()).get();

// const Robj = {
//   null: robject("null").schema(z.null()).attr(z.undefined()).json(z.null()),
//   clos: robject("clos").schema(
//     z.object({
//       formats: z.any(),
//       body: z.any(),
//     })
//   ),
//   double_array: robject("double_array")
//     .schema(z.instanceof(Float64Array))
//     .attr(z.undefined().optional())
//     .json(z.union([z.number(), z.array(z.number())])),
// };

// const rtypes = {
//   numeric: sexp(Robj.double_array),
// };

// // export type RTypes = {
// //   [K in keyof typeof rtypes]: z.infer<(typeof rtypes)[K]>;
// // };

// export default rtypes;

// // type RObject<
// //   T extends string,
// //   V = unknown,
// //   A extends RTaggedList<any> | undefined = undefined,
// //   J = V
// // > = {
// //   type: T;
// //   value: V;
// //   attributes: A;
// //   json: () => J &
// //     (V extends Int32Array | Float64Array | {} ? { r_type: T } : {});
// // };

// // // const robject = <
// // //   T extends string,
// // //   V extends z.ZodTypeAny,
// // //   J extends z.ZodTypeAny
// // // >(
// // //   type: T,
// // //   schema: V,
// // //   json?: J
// // // ) => {
// // //   return z.object({
// // //     type: z.literal(type),
// // //     value: schema,
// // //     attributes: z.union([z.undefined(), z.function()]),
// // //     json: z.function().returns(json ?? schema),
// // //   });
// // // };

// // // const integer = robject("int_array", z.array(z.number()));

// // type RSEXP<T extends RObject<any>> = RObject<"sexp", T>;

// // /** defining R data structure in typescript */

// // type RInteger = RObject<"int_array", Int32Array>;
// // type RNumeric = RObject<"double_array", Float64Array>;
// // type RBoolean = RObject<"bool_array", boolean[]>;
// // type RCharacter<V extends string[] = string[]> = RObject<"string_array", V>;

// // type RTaggedList<T extends Record<string, RObject<any>>> = RObject<
// //   "tagged_list",
// //   {
// //     [K in keyof T]: {
// //       name: K;
// //       value: T[K];
// //     };
// //   }
// // >;

// // type X = RTaggedList<{ names: RCharacter<["one", "two"]>; class: RCharacter }>;

// // type RVector<T extends Record<string, RObject<any>>> = RObject<
// //   "vector",
// //   T,
// //   keyof T extends string
// //     ? RTaggedList<{
// //         names: RCharacter<(keyof T)[]>;
// //       }>
// //     : never
// // >;

// // type RType = RInteger | RNumeric | RBoolean | RCharacter;

// // // maybe we can use zod to fix up the orders etc.
// // type Y = RVector<{ x: RCharacter<["one", "two"]>; y: RNumeric }>;
// // type x = Y["json"];
