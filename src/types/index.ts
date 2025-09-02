import { z } from "zod";
import {
  object,
  objectWithAttributes,
  typeWithAttributes,
  UnifyOne,
  WithAttributes,
} from "./helpers";
import { promisify } from "../helpers";
import _recursive_list from "./recursive";
import _js_function from "./jstype";

const sexp = <T extends z.ZodTypeAny>(json: T) => {
  return z.object({
    type: z.literal("sexp"),
    value: z.object({
      json: z.function().returns(json),
    }),
  });
};

type Attributes<T extends z.ZodRawShape> = z.ZodIntersection<
  z.ZodObject<T>,
  z.ZodRecord<z.ZodString, z.ZodTypeAny>
>;
const attributes = <T extends z.ZodRawShape>(schema: T): Attributes<T> =>
  z.object(schema).and(z.record(z.string(), z.any()));

// null
const _null = () => z.null();

const nameAttr = z.string().or(
  z
    .string()
    .array()
    .and(
      z.object({
        r_type: z.literal("string_array"),
      })
    )
);

// vector (i.e., an R list)
const _vector_noargs = () =>
  z.union([
    z.record(z.string(), z.any()).and(
      z.object({
        r_type: z.literal("vector"),
        r_attributes: attributes({ names: nameAttr }),
      })
    ),
    typeWithAttributes(z.array(z.any()), "vector", undefined),
  ]);

// We need to do this otherwise using overloads (with zod??)
// produces a recursion that breaks DTS compilation ...
type VectorArray<T extends z.ZodRecord<z.ZodString, z.ZodTypeAny>> = z.ZodType<
  z.TypeOf<T> & {
    r_type: "vector";
    r_attributes: z.TypeOf<z.ZodObject<{ names: typeof nameAttr }>>;
  }
>;

const _vector_array = <T extends z.ZodRecord<z.ZodString, z.ZodTypeAny>>(
  schema: T
): VectorArray<T> =>
  typeWithAttributes(schema, "vector", {
    names: nameAttr,
  });

type VectorTuple<T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]> = z.ZodType<
  z.TypeOf<z.ZodTuple<T>> & {
    r_type: "vector";
    r_attributes: {
      [x: string]: any;
    };
  }
>;
const _vector_tuple = <T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  schema: T
): VectorTuple<T> => typeWithAttributes(z.tuple(schema), "vector", undefined);

type VectorObject<T extends z.ZodRawShape> = z.ZodIntersection<
  z.ZodObject<T, "strip">,
  z.ZodObject<
    {
      r_type: z.ZodLiteral<"vector">;
      r_attributes: Attributes<{
        names: WithAttributes<string[], "string_array", z.ZodRawShape>;
      }>;
    },
    "strip"
  >
>;

const _vector_object = <T extends z.ZodRawShape>(schema: T): VectorObject<T> =>
  z.object(schema).and(
    z.object({
      r_type: z.literal("vector"),
      r_attributes: attributes({
        names: _string(Object.keys(schema).length),
      }),
    })
  );

// an array-like list of a repeated structure
type VectorRepArray<T extends z.ZodTypeAny> = z.ZodType<
  z.TypeOf<z.ZodArray<T>> & {
    r_type: "vector";
    r_attributes: {
      [x: string]: any;
    };
  }
>;

const _vector_reparray = <T extends z.ZodTypeAny>(
  schema: T
): VectorRepArray<T> =>
  typeWithAttributes(z.array(schema), "vector", undefined);

function _vector(): ReturnType<typeof _vector_noargs>;
function _vector<T extends z.ZodRecord<z.ZodString, z.ZodTypeAny>>(
  schema: T
): VectorArray<T>;
function _vector<T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  schema: T
): VectorTuple<T>;
function _vector<T extends z.ZodRawShape>(schema: T): VectorObject<T>;
function _vector<T extends z.ZodTypeAny>(schema: T): VectorRepArray<T>;
function _vector(
  schema?:
    | z.ZodRawShape
    | [z.ZodTypeAny, ...z.ZodTypeAny[]]
    | z.ZodTypeAny
    | z.ZodRecord<z.ZodString, z.ZodTypeAny>
) {
  if (schema === undefined) return _vector_noargs();
  return schema === undefined
    ? _vector_noargs()
    : Array.isArray(schema)
    ? (_vector_tuple(schema) as any)
    : schema instanceof z.ZodRecord
    ? _vector_array(schema)
    : schema instanceof z.ZodType
    ? _vector_reparray(schema)
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
type FactorWithLevels<
  L extends string,
  A extends z.ZodRawShape = {}
> = z.ZodType<
  (L | undefined)[] & {
    levels: L[] & {
      r_type: "string_array";
    };
    r_type: "int_array";
    r_attributes: UnifyOne<
      {
        class: "factor";
        levels: L[] & {
          r_type: "string_array";
        };
      } & z.infer<z.ZodObject<A, "strip">> & { [K in string]: any }
    >;
  }
>;

function _factorWithLevels<
  const L extends string,
  A extends z.ZodRawShape = {}
>(levels: L[], attr?: A): FactorWithLevels<L, A> {
  return z.custom<
    (L | undefined)[] & {
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
    if (
      data
        .filter((d: string) => d) // no need to check undefineds
        .map((d: L) => levels.includes(d))
        .includes(false)
    )
      return false;

    return true;
  });
}

type FactorWithUnknownLevels<A extends z.ZodRawShape = {}> = z.ZodType<
  (string | undefined)[] & {
    levels: string[] & {
      r_type: "string_array";
    };
    r_type: "int_array";
    r_attributes: UnifyOne<
      {
        class: "factor";
        levels: string[] & {
          r_type: "string_array";
        };
      } & z.infer<z.ZodObject<A>> & { [K in string]: any }
    >;
  }
>;

function _factorWithUnknownLevels<A extends z.ZodRawShape = {}>(
  attr?: A
): FactorWithUnknownLevels<A> {
  return z.custom<
    (string | undefined)[] & {
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

    // all values in data must be in levels OR undefined
    if (
      data
        .filter((d: string) => d) // no need to check undefineds
        .map((d: string) => data.levels.includes(d))
        .includes(false)
    )
      return false;

    return true;
  });
}

function _factor<A extends z.ZodRawShape>(attr?: A): FactorWithUnknownLevels<A>;
function _factor<const L extends string, A extends z.ZodRawShape>(
  levels: L[],
  attr?: A
): FactorWithLevels<L, A>;
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

// TRY ERROR: string with attributes class = "try-error", condition = {message: string, call: lang}
const R_SERVER_ERROR = z.tuple([z.string(), z.number()]);

export type RServeError = z.infer<typeof R_SERVER_ERROR>;

// function _error() {
//   return objectWithAttributes(
//     z.string().array(),
//     "string_array",
//     z.object({
//       class: z.literal("try-error"),
//       condition: _vector_object({
//         message: z.string(),
//       }),
//     })
//   );
// }
// type RError = z.infer<ReturnType<typeof _error>>;

function ocap<
  TArgs extends [z.ZodTypeAny, ...z.ZodTypeAny[]] | [] = [],
  TRes extends z.ZodTypeAny = z.ZodTypeAny
>(args: TArgs, res: TRes) {
  return z
    .function(
      z.tuple([
        ...args,
        z.function(
          z.tuple([R_SERVER_ERROR.nullable(), res.optional()]),
          z.void()
        ),
      ]),
      z.void()
    )
    .transform(
      (f) =>
        promisify(f) as (
          ...args: {
            [K in keyof TArgs]: z.infer<TArgs[K]>;
          }
        ) => Promise<z.infer<TRes>>
    );
}

const dfAttr = z.object({
  r_type: z.literal("vector"),
  r_attributes: attributes({
    names: z.array(z.string()).or(z.string()),
    class: z.literal("data.frame"),
    "row.names": z.union([_string(), _integer(), _double()]).optional(),
  }),
});

type DataframeUnknown = z.ZodIntersection<
  z.ZodRecord<z.ZodTypeAny>,
  typeof dfAttr
>;
const _dataframe_unknown = (): DataframeUnknown =>
  z.record(z.any()).and(dfAttr);

type DataframeKnown<T extends z.ZodRawShape> = z.ZodIntersection<
  z.ZodObject<T>,
  typeof dfAttr
>;
const _dataframe_known = <T extends z.ZodRawShape>(
  schema: T
): DataframeKnown<T> => z.object(schema).and(dfAttr);

function _dataframe(): DataframeUnknown;
function _dataframe<T extends z.ZodRawShape>(schema: T): DataframeKnown<T>;
function _dataframe(schema?: z.ZodRawShape) {
  return schema === undefined ? _dataframe_unknown() : _dataframe_known(schema);
}

const Robj = {
  null: _null,
  integer: _integer,
  numeric: _double,
  character: _string,
  logical: _boolean,
  vector: _vector,
  list: _vector,
  symbol: _symbol,
  lang: _lang,
  tagged_list: _tagged_list,
  factor: _factor,
  dataframe: _dataframe,
  ocap,
  sexp,
  recursive_list: _recursive_list,
  js_function: _js_function,
};

export default Robj;
