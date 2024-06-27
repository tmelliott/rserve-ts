import { z } from "zod";

export const sexp = <T extends z.ZodTypeAny>(json: T) => {
  return z.object({
    type: z.literal("sexp"),
    value: z.object({
      json: z.function().returns(json),
    }),
  });
};

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
): z.ZodNumber | IntegerVectorWithAttr<z.ZodObject<T, "strip">>;
function integer<L extends number, T extends z.ZodRawShape>(
  len: L,
  attr: T
): L extends 1 ? z.ZodNumber : IntegerVectorWithAttr<z.ZodObject<T, "strip">>;
function integer(x?: number | z.ZodRawShape, y?: z.ZodRawShape) {
  if (typeof x === "number") {
    if (x === 1) return z.number();
    return integerVectorWithAttr(y ? z.object(y) : z.unknown(), x);
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

const characterWithAttr = <T extends z.ZodTypeAny>(attr: T) =>
  z.union([
    z.string(),
    z
      .object({
        data: z.array(z.string()),
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
      }),
  ]);
type CharacterWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof characterWithAttr<T>
>;
function character(): CharacterWithAttr<z.ZodUnknown>;
function character<T extends z.ZodRawShape>(
  attr: T
): CharacterWithAttr<z.ZodObject<T, "strip">>;
function character(attr?: z.ZodRawShape) {
  if (attr) return characterWithAttr(z.object(attr));
  return characterWithAttr(z.unknown());
}

export { integer, numeric, character };
