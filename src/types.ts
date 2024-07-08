import { R } from "vitest/dist/reporters-yx5ZTtEV";
import { array, z } from "zod";

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
function character<
  const V extends [string, ...string[]],
  T extends z.ZodRawShape
>(values: V, attr?: T): Robject<ArrayToTuple<V>, "string_array">;
function character(
  a?: [string, ...string[]] | number | z.ZodRawShape,
  b?: z.ZodRawShape
) {
  const attr = typeof a === "number" || Array.isArray(a) ? b : a;

  if (Array.isArray(a)) {
    return robject(arrayToTuple(a) as any, "string_array");
  }

  const len = typeof a === "number" ? a : undefined;

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

type TupleOf<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

const tupleOf = <T, N extends number>(t: T, n: N) => {
  return Array(n).fill(t) as TupleOf<T, N>;
};

type Table<D extends number | number[] | [number, ...number[]]> = Robject<
  ZodInt32Array,
  "int_array",
  z.ZodObject<
    {
      dim: D extends [number, ...number[]]
        ? Robject<ArrayToTuple<D>, "int_array">
        : Robject<z.ZodLiteral<D>, "int_array">;
    },
    "strip"
  >
>;

function table<const D extends number>(
  dim: D
): D extends 1 ? Table<number> : Table<TupleOf<number, D>>;
function table<const D extends [number, ...number[]]>(
  dim: D
): Table<D extends [number] ? D[0] : D>;
function table(x: number | [number, ...number[]]) {
  const dim = Array.isArray(x) ? x : tupleOf(x, 1);

  return robject(
    z.instanceof(Int32Array),
    "int_array",
    z.object({
      dim: robject(
        dim.length === 1
          ? z.literal(dim[0])
          : z.instanceof(Int32Array).transform((x) => Array.from(x)),
        "int_array"
      ),
    })
  ) as any;
}

type List<
  T extends z.ZodRawShape | z.ZodTuple | undefined = undefined,
  A extends z.ZodRawShape = Record<string, z.ZodTypeAny>
> = Robject<
  T extends undefined
    ? z.ZodRecord<
        z.ZodString,
        z.ZodObject<
          {
            data: z.ZodTypeAny;
            r_type: z.ZodString;
            r_attributes: z.ZodTypeAny;
          },
          "strip"
        >
      >
    : T extends z.ZodRawShape
    ? z.ZodObject<T, "strip">
    : T,
  "vector",
  z.ZodObject<
    (T extends z.ZodRawShape
      ? {
          names: Robject<z.ZodArray<z.ZodString>, "string_array">;
        }
      : T extends z.ZodTuple
      ? {}
      : {
          names?: Robject<z.ZodArray<z.ZodString>, "string_array">;
        }) &
      A,
    "strip"
  >
>;

function list(): List;
function list<
  const T extends z.ZodRawShape,
  const A extends z.ZodRawShape = Record<string, z.ZodTypeAny>
>(schema: T, attr?: A): List<T, A>;
function list<
  const T extends [z.ZodTypeAny, ...z.ZodTypeAny[]],
  const A extends z.ZodRawShape = Record<string, z.ZodTypeAny>
>(schema: T, attr?: A): List<z.ZodTuple<T>, A>;
function list(
  schema?: z.ZodRawShape | [z.ZodTypeAny, ...z.ZodTypeAny[]],
  attr?: z.ZodRawShape
) {
  return robject(
    schema
      ? Array.isArray(schema)
        ? z.tuple(schema)
        : z.object(schema)
      : z.record(
          z.string(),
          z.object({
            data: z.any(),
            r_type: z.string(),
            r_attributes: z.any(),
          })
        ),
    "vector",
    attr
      ? z.object({
          ...attr,
          names: schema ? character(Object.keys(schema).length) : character(),
        })
      : z.any()
  ) as any;
}

export { logical, integer, numeric, character, factor, table, list };
