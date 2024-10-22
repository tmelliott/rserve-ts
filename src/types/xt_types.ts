import { z } from "zod";
import { object, typeWithAttributes, Unify, UnifyOne } from "./helpers";

// alright let's try this again ...

const attributes = <T extends z.ZodRawShape>(schema: T) =>
  z.object(schema).and(z.record(z.string(), z.any()));

// following the order or Rserve.type_id:

// null
const _null = () => z.null();

// vector (i.e., an R list)
const _vector_noargs = () =>
  z
    .record(z.string(), z.any())
    .and(
      z.object({
        r_type: z.literal("vector"),
        r_attributes: attributes({ names: z.array(z.string()).or(z.string()) }),
      })
    )
    .or(typeWithAttributes(z.array(z.any()), "vector", undefined));

const _vector_array = <T extends z.ZodRecord<z.ZodString, z.ZodTypeAny>>(
  schema: T
) => typeWithAttributes(schema, "vector", undefined);

const _vector_tuple = <T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  schema: T
) => typeWithAttributes(z.tuple(schema), "vector", undefined);

const _vector_object = <T extends z.ZodRawShape>(schema: T) =>
  z.object(schema).and(
    z.object({
      r_type: z.literal("vector"),
      r_attributes: attributes({ names: _string(Object.keys(schema).length) }),
    })
  );

function _vector(): ReturnType<typeof _vector_noargs>;
function _vector<T extends z.ZodRecord<z.ZodString, z.ZodTypeAny>>(
  schema: T
): ReturnType<typeof _vector_array<T>>;
function _vector<T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  schema: T
): ReturnType<typeof _vector_tuple<T>>;
function _vector<T extends z.ZodRawShape>(
  schema: T
): ReturnType<typeof _vector_object<T>>;
function _vector(
  schema?:
    | z.ZodRawShape
    | [z.ZodTypeAny, ...z.ZodTypeAny[]]
    | z.ZodRecord<z.ZodString, z.ZodTypeAny>
) {
  return schema === undefined
    ? _vector_noargs()
    : Array.isArray(schema)
    ? (_vector_tuple(schema) as any)
    : schema instanceof z.ZodRecord
    ? _vector_array(schema)
    : _vector_object(schema);
}

// symbol
const _symbol = () => z.string();

// lang
const _lang = () => typeWithAttributes(z.array(z.any()), "lang", undefined);

// tagged_list (plain_list, plain_object, or mixed_list)
const _tagged_list = () => z.record(z.string(), z.any());

// int_array
const _integer = object(
  z.number(),
  z.instanceof(Int32Array),
  // typeWithAttributes(z.instanceof(Int32Array), "int_array", undefined),
  "int_array"
);

// special case of int array is 'factor'
function _factorWithLevels<
  const L extends string,
  A extends z.ZodRawShape = {}
>(levels: L[], attr?: A) {
  return z.custom<
    L[] & {
      levels: L[] & { r_type: "string_array" };
      r_type: "int_array";
      r_attributes: UnifyOne<
        {
          class: "factor";
          levels: L[] & { r_type: "string_array" };
        } & z.infer<z.ZodObject<A>> & {
            [K in string]: any;
          }
      >;
    }
  >((data) => {
    if (typeof data !== "object") return false;
    if (!data.hasOwnProperty("r_type") || data.r_type !== "int_array")
      return false;
    if (!data.hasOwnProperty("levels")) return false;
    if (typeof data.levels !== "object") return false;
    if (
      !data.levels.hasOwnProperty("r_type") ||
      data.levels.r_type !== "string_array"
    )
      return false;

    // all of the levels must be present, and only once
    if (levels.map((l) => data.levels.includes(l)).includes(false))
      return false;
    if (levels.length !== data.levels.length) return false;

    // r_attributes - levels and class
    if (!data.hasOwnProperty("r_attributes")) return false;
    if (typeof data.r_attributes !== "object") return false;
    if (!data.r_attributes.hasOwnProperty("levels")) return false;
    if (typeof data.r_attributes.levels !== "object") return false;
    if (
      !data.r_attributes.levels.hasOwnProperty("r_type") ||
      data.r_attributes.levels.r_type !== "string_array"
    )
      return false;
    if (!data.r_attributes.hasOwnProperty("class")) return false;
    if (typeof data.r_attributes.class !== "string") return false;
    if (data.r_attributes.class !== "factor") return false;
    if (data.r_attributes.levels.length !== levels.length) return false;
    if (levels.map((l) => data.r_attributes.levels.includes(l)).includes(false))
      return false;

    // all values in data must be in levels
    if (data.map((d: L) => levels.includes(d)).includes(false)) return false;

    return true;
  });
}
function _factorWithUnknownLevels<A extends z.ZodRawShape = {}>(attr?: A) {
  return z.custom<
    string[] & {
      levels: string[] & { r_type: "string_array" };
      r_type: "int_array";
      r_attributes: UnifyOne<
        {
          class: "factor";
          levels: string[] & { r_type: "string_array" };
        } & z.infer<z.ZodObject<A>> & {
            [K in string]: any;
          }
      >;
    }
  >((data) => {
    if (typeof data !== "object") return false;
    if (!data.hasOwnProperty("r_type") || data.r_type !== "int_array")
      return false;
    if (!data.hasOwnProperty("levels")) return false;
    if (typeof data.levels !== "object") return false;
    if (
      !data.levels.hasOwnProperty("r_type") ||
      data.levels.r_type !== "string_array"
    )
      return false;

    // data.levels are unique strings
    if (new Set(data.levels).size !== data.levels.length) return false;
    if (data.levels.length === 0) return false;
    if (data.levels.some((l: unknown) => typeof l !== "string")) return false;

    // r_attributes - levels and class
    if (!data.hasOwnProperty("r_attributes")) return false;
    if (typeof data.r_attributes !== "object") return false;
    if (!data.r_attributes.hasOwnProperty("levels")) return false;
    if (typeof data.r_attributes.levels !== "object") return false;
    if (
      !data.r_attributes.levels.hasOwnProperty("r_type") ||
      data.r_attributes.levels.r_type !== "string_array"
    )
      return false;
    if (!data.r_attributes.hasOwnProperty("class")) return false;
    if (typeof data.r_attributes.class !== "string") return false;
    if (data.r_attributes.class !== "factor") return false;
    if (data.r_attributes.levels.length !== data.levels.length) return false;
    if (
      data.levels
        .map((l: string) => data.r_attributes.levels.includes(l))
        .includes(false)
    )
      return false;

    // all values in data must be in levels
    if (data.map((d: string) => data.levels.includes(d)).includes(false))
      return false;

    return true;
  });
}

function _factor<A extends z.ZodRawShape>(
  attr?: A
): ReturnType<typeof _factorWithUnknownLevels<A>>;
function _factor<const L extends string, A extends z.ZodRawShape>(
  levels: L[],
  attr?: A
): ReturnType<typeof _factorWithLevels<L, A>>;
function _factor(x?: string[] | z.ZodRawShape, y?: z.ZodRawShape) {
  if (Array.isArray(x)) return _factorWithLevels(x, y);
  return _factorWithUnknownLevels(x);
}

// double_array
const _double = object(
  z.number(),
  z.instanceof(Float64Array),
  // typeWithAttributes(z.instanceof(Float64Array), "double_array", undefined),
  "double_array"
);

// string_array
const _string = object(z.string(), z.string().array(), "string_array");

// bool_array
const _boolean = object(z.boolean(), z.boolean().array(), "bool_array");

const Robj = {
  null: _null,
  integer: _integer,
  double: _double,
  string: _string,
  boolean: _boolean,
  vector: _vector,
  symbol: _symbol,
  lang: _lang,
  tagged_list: _tagged_list,
  factor: _factor,
};

export default Robj;
