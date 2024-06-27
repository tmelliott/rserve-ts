import { z } from "zod";

export const sexp = <T extends z.ZodTypeAny>(json: T) => {
  return z.object({
    type: z.literal("sexp"),
    value: z.object({
      json: z.function().returns(json),
    }),
  });
};

const booleanVectorWithAttr = <T extends z.ZodTypeAny>(
  attr: T,
  len?: number
) => {
  return z
    .object({
      data: len
        ? z.array(z.boolean()).refine((x) => x.length === len)
        : z.array(z.boolean()),
      r_type: z.literal("bool_array"),
      r_attributes: attr,
    })
    .transform((x) => {
      const r: boolean[] & {
        r_type: "bool_array";
        r_attributes: T extends z.ZodUndefined ? undefined : z.infer<T>;
      } = x.data as any;
      r.r_type = x.r_type;
      r.r_attributes = x.r_attributes as any;
      return r;
    });
};

const unknownBooleanWithAttr = <T extends z.ZodTypeAny>(attr: T) => {
  return z.union([z.boolean(), booleanVectorWithAttr(attr)]);
};
type BooleanVectorWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof booleanVectorWithAttr<T>
>;
type UnknownBooleanWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof unknownBooleanWithAttr<T>
>;

function boolean(): UnknownBooleanWithAttr<z.ZodUnknown>;
function boolean<L extends number>(
  len: L
): L extends 1 ? z.ZodBoolean : BooleanVectorWithAttr<z.ZodUnknown>;
function boolean<T extends z.ZodRawShape>(
  attr: T
): BooleanVectorWithAttr<z.ZodObject<T, "strip">>;
function boolean<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): BooleanVectorWithAttr<z.ZodObject<T, "strip">>;
function boolean(x?: number | z.ZodRawShape, y?: z.ZodRawShape) {
  if (typeof x === "number") {
    if (y) return booleanVectorWithAttr(z.object(y), x);
    if (x === 1) return z.boolean();
    return booleanVectorWithAttr(z.unknown(), x);
  }
  return unknownBooleanWithAttr(x ? z.object(x) : z.unknown());
}

const integerVectorWithAttr = <T extends z.ZodTypeAny>(attr: T, len?: number) =>
  z
    .object({
      data: len
        ? z.instanceof(Int32Array).refine((x) => x.length === len)
        : z.instanceof(Int32Array),
      r_type: z.literal("int_array"),
      r_attributes: attr,
    })
    .transform((x) => {
      const r: number[] & {
        r_type: "int_array";
        r_attributes: T extends z.ZodUndefined ? undefined : z.infer<T>;
      } = x.data as any;
      r.r_type = x.r_type;
      r.r_attributes = x.r_attributes as any;
      return r;
    });
const unknownIntegerWithAttr = <T extends z.ZodTypeAny>(attr: T) =>
  z.union([z.number(), integerVectorWithAttr(attr)]);

type IntegerVectorWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof integerVectorWithAttr<T>
>;
type UnknownIntegerWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof unknownIntegerWithAttr<T>
>;

function integer(): UnknownIntegerWithAttr<z.ZodUnknown>;
function integer<L extends number>(
  len: L
): L extends 1 ? z.ZodNumber : IntegerVectorWithAttr<z.ZodUnknown>;
function integer<T extends z.ZodRawShape>(
  attr: T
): IntegerVectorWithAttr<z.ZodObject<T, "strip">>;
function integer<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): IntegerVectorWithAttr<z.ZodObject<T, "strip">>;
function integer(x?: number | z.ZodRawShape, y?: z.ZodRawShape) {
  if (typeof x === "number") {
    if (y) return integerVectorWithAttr(z.object(y), x);
    if (x === 1) return z.number();
    return integerVectorWithAttr(z.unknown(), x);
  }
  return unknownIntegerWithAttr(x ? z.object(x) : z.unknown());
}

const numericVectorWithAttr = <T extends z.ZodTypeAny>(attr: T, len?: number) =>
  z
    .object({
      data: len
        ? z.instanceof(Float64Array).refine((x) => x.length === len)
        : z.instanceof(Float64Array),
      r_type: z.literal("double_array"),
      r_attributes: attr,
    })
    .transform((x) => {
      const r: number[] & {
        r_type: "double_array";
        r_attributes: T extends z.ZodUndefined ? undefined : z.infer<T>;
      } = x.data as any;
      r.r_type = x.r_type;
      r.r_attributes = x.r_attributes as any;
      return r;
    });
const unknownNumericWithAttr = <T extends z.ZodTypeAny>(attr: T) =>
  z.union([z.number(), numericVectorWithAttr(attr)]);
type NumericVectorWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof numericVectorWithAttr<T>
>;
type UnknownNumericWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof unknownNumericWithAttr<T>
>;

function numeric(): UnknownNumericWithAttr<z.ZodUnknown>;
function numeric<L extends number>(
  len: L
): L extends 1 ? z.ZodNumber : NumericVectorWithAttr<z.ZodUnknown>;
function numeric<T extends z.ZodRawShape>(
  attr: T
): z.ZodNumber | NumericVectorWithAttr<z.ZodObject<T, "strip">>;
function numeric<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): L extends 1 ? z.ZodNumber : NumericVectorWithAttr<z.ZodObject<T, "strip">>;
function numeric(x?: number | z.ZodRawShape, y?: z.ZodRawShape) {
  if (typeof x === "number") {
    if (x === 1) return z.number();
    return numericVectorWithAttr(y ? z.object(y) : z.unknown(), x);
  }
  return unknownNumericWithAttr(x ? z.object(x) : z.unknown());
}

const characterVectorWithAttr = <T extends z.ZodTypeAny>(
  attr: T,
  len?: number
) => {
  return z
    .object({
      data: len
        ? z.array(z.string()).refine((x) => x.length === len)
        : z.array(z.string()),
      r_type: z.literal("string_array"),
      r_attributes: attr,
    })
    .transform((x) => {
      const r: string[] & {
        r_type: "string_array";
        r_attributes: T extends z.ZodUndefined ? undefined : z.infer<T>;
      } = x.data as any;
      r.r_type = x.r_type;
      r.r_attributes = x.r_attributes as any;
      return r;
    });
};
const unknownCharacterWithAttr = <T extends z.ZodTypeAny>(attr: T) =>
  z.union([z.string(), characterVectorWithAttr(attr)]);
type CharacterVectorWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof characterVectorWithAttr<T>
>;
type UnknownCharacterWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof unknownCharacterWithAttr<T>
>;

function character(): UnknownCharacterWithAttr<z.ZodUnknown>;
function character<L extends number>(
  len: L
): L extends 1 ? z.ZodString : CharacterVectorWithAttr<z.ZodUnknown>;
function character<T extends z.ZodRawShape>(
  attr: T
): z.ZodString | CharacterVectorWithAttr<z.ZodObject<T, "strip">>;
function character<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): L extends 1 ? z.ZodString : CharacterVectorWithAttr<z.ZodObject<T, "strip">>;
function character(x?: number | z.ZodRawShape, y?: z.ZodRawShape) {
  if (typeof x === "number") {
    if (x === 1) return z.string();
    return characterVectorWithAttr(y ? z.object(y) : z.unknown(), x);
  }
  return unknownCharacterWithAttr(x ? z.object(x) : z.unknown());
}

export { boolean, integer, numeric, character };
