import { z } from "zod";

export const sexp = <T extends z.ZodTypeAny>(json: T) => {
  return z.object({
    type: z.literal("sexp"),
    value: z.object({
      json: z.function().returns(json),
    }),
  });
};

function robject<TData extends z.ZodTypeAny, TType extends string>(
  data: TData,
  type: TType
): z.ZodObject<{
  data: TData;
  r_type: z.ZodLiteral<TType>;
  r_attributes: z.ZodUnknown;
}>;
function robject<
  TData extends z.ZodTypeAny,
  TType extends string,
  TAttr extends z.ZodTypeAny
>(
  data: TData,
  type: TType,
  attr: TAttr
): z.ZodObject<{
  data: TData;
  r_type: z.ZodLiteral<TType>;
  r_attributes: TAttr;
}>;
function robject<
  TData extends z.ZodTypeAny,
  TType extends string,
  TAttr extends z.ZodTypeAny
>(data: TData, type: TType, attr?: TAttr) {
  return z.object({
    data: data,
    r_type: z.literal(type),
    r_attributes: attr ? attr : z.unknown(),
  });
}
type Robject<
  TData extends z.ZodTypeAny,
  TType extends string,
  TAttr extends z.ZodTypeAny = z.ZodUnknown
> = ReturnType<typeof robject<TData, TType, TAttr>>;

function logical(): Robject<
  z.ZodUnion<[z.ZodBoolean, z.ZodArray<z.ZodBoolean>]>,
  "bool_array"
>;
function logical<L extends number>(
  len: L
): L extends 1
  ? Robject<z.ZodBoolean, "bool_array">
  : Robject<z.ZodArray<z.ZodBoolean>, "bool_array">;
function logical<T extends z.ZodRawShape>(
  attr: T
): Robject<z.ZodArray<z.ZodBoolean>, "bool_array", z.ZodObject<T, "strip">>;
function logical<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): Robject<z.ZodArray<z.ZodBoolean>, "bool_array", z.ZodObject<T, "strip">>;
function logical(a?: number | z.ZodRawShape, b?: z.ZodRawShape) {
  const len = typeof a === "number" ? a : undefined;
  const attr = typeof a === "number" ? b : a;

  return robject(
    attr
      ? z.array(z.boolean())
      : len
      ? len === 1
        ? z.boolean()
        : z.array(z.boolean())
      : z.union([z.boolean(), z.array(z.boolean())]),
    "bool_array",
    attr ? z.object(attr) : z.unknown()
  );
}

type ZodInt32Array = z.ZodType<Int32Array, z.ZodTypeDef, Int32Array>;

function integer(): Robject<
  z.ZodUnion<[z.ZodNumber, ZodInt32Array]>,
  "int_array"
>;
function integer<L extends number>(
  len: L
): L extends 1
  ? Robject<z.ZodNumber, "int_array">
  : Robject<ZodInt32Array, "int_array">;
function integer<T extends z.ZodRawShape>(
  attr: T
): Robject<ZodInt32Array, "int_array", z.ZodObject<T, "strip">>;
function integer<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): Robject<ZodInt32Array, "int_array", z.ZodObject<T, "strip">>;
function integer(a?: number | z.ZodRawShape, b?: z.ZodRawShape) {
  const len = typeof a === "number" ? a : undefined;
  const attr = typeof a === "number" ? b : a;

  return robject(
    attr
      ? z.instanceof(Int32Array)
      : len
      ? len === 1
        ? z.number()
        : z.instanceof(Int32Array)
      : z.union([z.number(), z.instanceof(Int32Array)]),
    "int_array",
    attr ? z.object(attr) : z.unknown()
  );
}

type ZodFloat64Array = z.ZodType<Float64Array, z.ZodTypeDef, Float64Array>;

function numeric(): Robject<
  z.ZodUnion<[z.ZodNumber, ZodFloat64Array]>,
  "double_array"
>;
function numeric<L extends number>(
  len: L
): L extends 1
  ? Robject<z.ZodNumber, "double_array">
  : Robject<ZodFloat64Array, "double_array">;
function numeric<T extends z.ZodRawShape>(
  attr: T
): Robject<ZodFloat64Array, "double_array", z.ZodObject<T, "strip">>;
function numeric<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): Robject<ZodFloat64Array, "double_array", z.ZodObject<T, "strip">>;
function numeric(a?: number | z.ZodRawShape, b?: z.ZodRawShape) {
  const len = typeof a === "number" ? a : undefined;
  const attr = typeof a === "number" ? b : a;

  return robject(
    attr
      ? z.instanceof(Float64Array)
      : len
      ? len === 1
        ? z.number()
        : z.instanceof(Float64Array)
      : z.union([z.number(), z.instanceof(Float64Array)]),
    "double_array",
    attr ? z.object(attr) : z.unknown()
  );
}

function character(): Robject<
  z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>,
  "string_array"
>;
function character<L extends number>(
  len: L
): L extends 1
  ? Robject<z.ZodString, "string_array">
  : Robject<z.ZodArray<z.ZodString>, "string_array">;
function character<T extends z.ZodRawShape>(
  attr: T
): Robject<z.ZodArray<z.ZodString>, "string_array", z.ZodObject<T, "strip">>;
function character<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): Robject<z.ZodArray<z.ZodString>, "string_array", z.ZodObject<T, "strip">>;
function character(a?: number | z.ZodRawShape, b?: z.ZodRawShape) {
  const len = typeof a === "number" ? a : undefined;
  const attr = typeof a === "number" ? b : a;

  return robject(
    attr
      ? z.array(z.string())
      : len
      ? len === 1
        ? z.string()
        : z.array(z.string())
      : z.union([z.string(), z.array(z.string())]),
    "string_array",
    attr ? z.object(attr) : z.unknown()
  );
}

const factorWithAttr = <
  L extends z.ZodTuple | z.ZodArray<z.ZodString>,
  T extends z.ZodTypeAny
>(
  levels: L,
  attr: T
) => {
  return z.object({
    data: z.array(z.string()),
    levels: levels,
    r_type: z.literal("int_array"),
    r_attributes: attr.and(
      z.object({
        levels: character(2).extend({
          data: levels,
        }),
        class: character(1).extend({
          data: z.literal("factor"),
        }),
      })
    ),
  });
};

type ArrayToLiteralArray<T extends [any, ...any[]]> = {
  [P in keyof T]: z.ZodLiteral<T[P]>;
};
const arrayToTuple = <T extends [any, ...any[]]>(x: T) => {
  return z.tuple(x.map((l) => z.literal(l)) as ArrayToLiteralArray<T>);
};
type ArrayToTuple<T extends [any, ...any[]]> = ReturnType<
  typeof arrayToTuple<T>
>;

type FactorWithAttr<
  L extends z.ZodTuple | z.ZodArray<z.ZodString>,
  T extends z.ZodTypeAny
> = ReturnType<typeof factorWithAttr<L, T>>;

function factor(): FactorWithAttr<z.ZodArray<z.ZodString>, z.ZodUnknown>;
function factor<const L extends [string, ...string[]]>(
  levels: L
): FactorWithAttr<ArrayToTuple<L>, z.ZodUnknown>;
function factor<const L extends [string, ...string[]], T extends z.ZodRawShape>(
  levels: L,
  attr: T
): FactorWithAttr<ArrayToTuple<L>, z.ZodObject<T, "strip">>;
function factor<T extends z.ZodRawShape>(
  levels: undefined,
  attr: T
): FactorWithAttr<z.ZodArray<z.ZodString>, z.ZodObject<T, "strip">>;

function factor<
  const L extends [string, ...string[]] | undefined,
  T extends z.ZodRawShape
>(lvls?: L, attr?: T) {
  if (lvls) {
    return factorWithAttr(
      arrayToTuple(lvls),
      attr ? z.object(attr) : z.unknown()
    );
  }
  return factorWithAttr(
    z.string().array(),
    attr ? z.object(attr) : z.unknown()
  );
}

// A table is an n-dimensional array with names for each dimension
// The dimensions can optionally be named also.
// names: {dim1: [name11, name12, ...], dim2: [name21, name22, ...], ...}
// data: [[x11, x12, ...], [x21, x22, ...], ...]
// R returns this as an integer vector
// function table<const D extends [number]>(
//   dim: D
// );

// type TableWithAttr<D extends [number, ...number[]]> = D extends [number]
//   ? IntegerVectorWithAttr<z.ZodObject<{ dim: z.ZodLiteral<D[0]> }>>
//   : IntegerVectorWithAttr<
//       z.ZodObject<{
//         dim: ArrayToTuple<D> &
//           z.ZodObject<{
//             r_type: z.ZodLiteral<"int_array">;
//             r_attributes: z.ZodUnknown;
//           }>;
//       }>
//     >;

// function table<const D extends [number, ...number[]]>(dim: D) {
//   const n = dim.reduce((a, b) => a * b, 1);
//   const x = integer(n, {
//     dim:
//       dim.length === 1
//         ? z.literal(dim[0])
//         : arrayToTuple(dim).transform((x) => {
//             const d: z.infer<ArrayToTuple<D>> & {
//               r_type: "int_array";
//               r_attributes: undefined;
//             } = x as any;
//             d.r_type = "int_array";
//             d.r_attributes = undefined;
//             return x;
//           }),
//   }) as TableWithAttr<D>;
//   return x;
// }

export { logical, integer, numeric, character, factor };
