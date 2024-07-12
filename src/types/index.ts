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

type ZVector<
  V extends string = string,
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined,
  TSingle extends z.ZodTypeAny = z.ZodTypeAny,
  TMulti extends z.ZodTypeAny = z.ZodArray<TSingle>
> = A extends z.ZodRawShape
  ? Robject<TMulti, V, z.ZodObject<A, "strip">>
  : Robject<
      L extends undefined
        ? z.ZodUnion<[TSingle, TMulti]>
        : L extends 1
        ? TSingle
        : TMulti,
      V,
      z.ZodUnknown
    >;
export type Vector = z.infer<ZVector>;

type ZLogical<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = ZVector<"bool_array", L, A, z.ZodBoolean>;
export type Logical<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = z.infer<ZLogical<L, A>>;

function logical(): ZLogical;
function logical<L extends number>(len: L): ZLogical<L>;
function logical<T extends z.ZodRawShape>(attr: T): ZLogical<undefined, T>;
function logical<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): ZLogical<L, T>;
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

type ZInteger<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = ZVector<"int_array", L, A, z.ZodNumber, ZodInt32Array>;
export type Integer<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = z.infer<ZInteger<L, A>>;

function integer(): ZInteger;
function integer<L extends number>(len: L): ZInteger<L>;
function integer<T extends z.ZodRawShape>(attr: T): ZInteger<undefined, T>;
function integer<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): ZInteger<L, T>;
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

type ZNumeric<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = ZVector<"double_array", L, A, z.ZodNumber, ZodFloat64Array>;
export type Numeric<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = z.infer<ZNumeric<L, A>>;

function numeric(): ZNumeric;
function numeric<L extends number>(len: L): ZNumeric<L>;
function numeric<T extends z.ZodRawShape>(attr: T): ZNumeric<undefined, T>;
function numeric<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): ZNumeric<L, T>;
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

type ZCharacter<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = ZVector<"string_array", L, A, z.ZodString>;
export type Character<
  L extends number | undefined = undefined,
  A extends z.ZodRawShape | undefined = undefined
> = z.infer<ZCharacter<L, A>>;

function character(): ZCharacter;
function character<L extends number>(len: L): ZCharacter<L>;
function character<T extends z.ZodRawShape>(attr: T): ZCharacter<undefined, T>;
function character<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): ZCharacter<L, T>;
// TODO: Can this be a generic ZCharacter too?
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

type ZFactor<L extends [string, ...string[]] | undefined = undefined> =
  FactorWithAttr<
    L extends [string, ...string[]] ? ArrayToTuple<L> : z.ZodArray<z.ZodString>,
    z.ZodUnknown
  >;
export type Factor<L extends [string, ...string[]] | undefined = undefined> =
  z.infer<ZFactor<L>>;

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

type ZTable<D extends number | number[] | [number, ...number[]] = number[]> =
  Robject<
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
export type Table<
  D extends number | number[] | [number, ...number[]] = number[]
> = z.infer<ZTable<D>>;

function table<const D extends number>(
  dim: D
): D extends 1 ? ZTable<number> : ZTable<TupleOf<number, D>>;
function table<const D extends [number, ...number[]]>(
  dim: D
): ZTable<D extends [number] ? D[0] : D>;
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

export type ZTypes =
  | ZLogical
  | ZInteger
  | ZNumeric
  | ZCharacter
  | ZFactor
  | ZTable;
export type RTypes = z.infer<ZTypes>;

type ZList<
  T extends z.ZodRawShape | z.ZodTuple | undefined = undefined,
  A extends z.ZodRawShape = Record<string, z.ZodTypeAny>
> = Robject<
  T extends undefined
    ? z.ZodRecord<z.ZodString, ZTypes>
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
export type List<
  T extends Record<string, RTypes> = Record<string, RTypes>,
  A extends Record<string, RTypes> = Record<string, RTypes>
> = {
  data: T;
  r_type: "vector";
  r_attributes: A;
};

function list(): ZList;
function list<
  const T extends z.ZodRawShape,
  const A extends z.ZodRawShape = Record<string, z.ZodTypeAny>
>(schema: T, attr?: A): ZList<T, A>;
function list<
  const T extends [z.ZodTypeAny, ...z.ZodTypeAny[]],
  const A extends z.ZodRawShape = Record<string, z.ZodTypeAny>
>(schema: T, attr?: A): ZList<z.ZodTuple<T>, A>;
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
