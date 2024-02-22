import RserveError from "./RserveError";
import Rsrv from "./Rsrv";

type TypedArray = ArrayBufferView & {
  BYTES_PER_ELEMENT: number;
};

export function isTypedArray(a: unknown): a is TypedArray {
  return (
    ArrayBuffer.isView(a) &&
    "BYTES_PER_ELEMENT" in a &&
    typeof a.BYTES_PER_ELEMENT === "number" &&
    a.BYTES_PER_ELEMENT > 0
  );
}

type Rtype =
  | null
  | undefined
  | boolean
  | number
  | string
  | TypedArray
  | Array<string | boolean | number>
  | ArrayBuffer;

function type_id(value: unknown): number {
  if (value === null || value === undefined) return Rsrv.XT_NULL;

  if (typeof value === "boolean") return Rsrv.XT_ARRAY_BOOL;
  if (typeof value === "number") return Rsrv.XT_ARRAY_DOUBLE;
  if (typeof value === "string") return Rsrv.XT_ARRAY_STR;

  if (isTypedArray(value)) return Rsrv.XT_ARRAY_DOUBLE;

  if (value instanceof ArrayBuffer) return Rsrv.XT_RAW;

  // arraybuffers
  //   if (value.byteLength !== undefined && value.slice !== undefined)
  //     return Rsrv.XT_RAW;

  // lists
  if (Array.isArray(value)) {
    if (value.length === 0) return Rsrv.XT_VECTOR;

    // lists of strings (important for tags)
    if (value.every((v) => typeof v === "string")) return Rsrv.XT_ARRAY_STR;

    if (value.every((v) => typeof v === "boolean")) return Rsrv.XT_ARRAY_BOOL;

    // arbitrary lists
    return Rsrv.XT_VECTOR;
  }

  // functions get passed as an array_str with extra attributes
  if (typeof value === "function") return Rsrv.XT_ARRAY_STR | Rsrv.XT_HAS_ATTR;

  // objects
  if (typeof value === "object") return Rsrv.XT_VECTOR | Rsrv.XT_HAS_ATTR;

  throw new RserveError("Value type unrecognised by Rserve: " + value);
}

const list_size = <T extends Rtype>(lst: T[]) => {
  lst.reduce((memo, el) => {
    return memo + determine_size(el);
  }, 0);
};

const final_size = (payload_size: number) =>
  payload_size > 1 << 24 ? payload_size + 8 : payload_size + 4;

// const coerce_type = <T extends Rtype>(value: T) => {
//   if (value === null) return value as null;
//   if (value === undefined) return value as undefined;

//   if (typeof value === "boolean") return value as boolean;
//   if (typeof value === "number") return value as number;
//   if (typeof value === "string") return value as string;

//   return value;
// };

// const x = coerce_type(1);

type XT_NULL = null;
const is_XT_NULL = (value: unknown): value is XT_NULL =>
  value === null || value === undefined;

type XT_VECTOR = Array<any>;

type XT_ARRAY_BOOL = boolean | Array<boolean>;
const is_XT_ARRAY_BOOL = (value: unknown): value is XT_ARRAY_BOOL =>
  type_id(value) === Rsrv.XT_ARRAY_BOOL;

export function determine_size<T extends Rtype>(
  value: T,
  forced_type?: number
): number {
  const header_size = 4;

  if (is_XT_NULL(value)) return final_size(0);
  if (is_XT_ARRAY_BOOL(value)) {
    console.log(value);
    if (typeof value === "boolean") return final_size(8);
    else return final_size((value.length + 7) & ~3);
  }

  const t = forced_type ?? type_id(value);

  if (t === Rsrv.XT_NULL) return final_size(0);
  if (t === Rsrv.XT_ARRAY_BOOL) {
    if (typeof value === "boolean") return final_size(8);
    else return final_size((value.length + 7) & ~3);
  }

  //   switch (t & ~Rsrv.XT_LARGE) {
  //     case Rsrv.XT_NULL:
  //       return final_size(0);

  //     case Rsrv.XT_ARRAY_BOOL:
  //       if (typeof value === "boolean") return final_size(8);
  //       else return final_size((value.length + 7) & ~3);
  //   }

  return type_id(value);
}
