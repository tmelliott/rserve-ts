import { verify } from "crypto";
import { EndianAwareDataView, my_ArrayBufferView } from "./ArrayBufferView";
import RserveError from "./RserveError";
import Rsrv from "./Rsrv";
import { as } from "vitest/dist/reporters-O4LBziQ_";

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

export type Rtype =
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

const list_size = <T extends Rtype>(lst: T[]) =>
  lst.reduce((memo, el) => {
    return memo + determine_size(el);
  }, 0);

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

// type XT_NULL = null;
// const is_XT_NULL = (value: unknown): value is XT_NULL =>
//   value === null || value === undefined;

// type XT_VECTOR = Array<any>;

// type XT_ARRAY_BOOL = boolean | Array<boolean>;
// const is_XT_ARRAY_BOOL = (value: unknown): value is XT_ARRAY_BOOL =>
//   type_id(value) === Rsrv.XT_ARRAY_BOOL;

export function determine_size<T extends Rtype>(
  value: T,
  forced_type?: number
): number {
  const header_size = 4;
  const t = forced_type ?? type_id(value);

  switch (t & ~Rsrv.XT_LARGE) {
    case Rsrv.XT_NULL:
      return final_size(0);

    case Rsrv.XT_ARRAY_BOOL:
      if (typeof value === "boolean") return final_size(8);
      else return final_size(((value as boolean[]).length + 7) & ~3);

    case Rsrv.XT_ARRAY_STR:
      if (Array.isArray(value)) {
        const len = (value as string[])
          .map((str) => decodeURIComponent(encodeURIComponent(str)).length + 1)
          .reduce((memo, l) => memo + l);
        return final_size(len);
      } else {
        const utf8 = decodeURIComponent(encodeURIComponent(value as string));
        return final_size(utf8.length + 1);
      }

    case Rsrv.XT_ARRAY_DOUBLE:
      if (typeof value === "number") return final_size(8);
      return final_size(8 * (value as number[]).length);

    case Rsrv.XT_RAW:
      return final_size((value as ArrayBuffer).byteLength);

    case Rsrv.XT_VECTOR:
    case Rsrv.XT_LANG_NOTAG:
      return final_size(list_size(value as Array<string | boolean | number>));

    case Rsrv.XT_VECTOR | Rsrv.XT_HAS_ATTR:
      const names_size_1 = final_size("names".length + 3);
      const names_size_2 = determine_size(Object.keys(value as object));
      const names_size = names_size_1 + names_size_2;
      return final_size(names_size + list_size(Object.values(value as object)));

    case Rsrv.XT_ARRAY_STR | Rsrv.XT_HAS_ATTR:
      return (
        determine_size("0403556553") +
        header_size +
        header_size +
        "class".length +
        3 +
        determine_size(["javascript_function"])
      );

    default:
      throw new RserveError("Internal error, can't handle type " + t);
  }
}

export function write_into_view(
  value: Rtype,
  array_buffer_view: my_ArrayBufferView,
  forced_type: number | undefined,
  convert: (v: string) => string
) {
  const size = determine_size(value, forced_type);
  const is_large = size > 16777215;

  let t = forced_type ?? type_id(value);
  let i: number, current_offset: number, lbl: string;

  if (is_large) t = t | Rsrv.XT_LARGE;

  let read_view: EndianAwareDataView;
  const write_view = array_buffer_view.data_view();
  let payload_start: number;
  if (is_large) {
    payload_start = 8;
    write_view.setInt32(0, t + ((size - 8) << 8));
    write_view.setInt32(4, (size - 8) >>> 24);
  } else {
    payload_start = 4;
    write_view.setInt32(0, t + ((size - 4) << 8));
  }

  switch (t & ~Rsrv.XT_LARGE) {
    case Rsrv.XT_NULL:
      break;

    case Rsrv.XT_ARRAY_BOOL:
      if (typeof value === "boolean") {
        write_view.setUint32(payload_start, 1);
        write_view.setUint32(payload_start + 4, value ? 1 : 0);
      } else {
        const v = value as boolean[];
        write_view.setInt32(payload_start, v.length);
        for (i = 0; i < v.length; i++) {
          write_view.setUint8(payload_start + 4 + i, v[i] ? 1 : 0);
        }
      }

    case Rsrv.XT_ARRAY_STR:
      const vString = value as string | string[];
      if (Array.isArray(vString)) {
        let offset = payload_start;
        vString.forEach((el) => {
          const utf8 = decodeURIComponent(encodeURIComponent(el));
          for (i = 0; i < utf8.length; ++i, ++offset) {
            write_view.setUint8(offset, utf8.charCodeAt(i));
          }
          write_view.setUint8(offset++, 0);
        });
      } else {
        const utf8 = decodeURIComponent(encodeURIComponent(vString));
        for (i = 0; i < utf8.length; ++i) {
          write_view.setUint8(payload_start + i, utf8.charCodeAt(i));
        }
        write_view.setUint8(payload_start + utf8.length, 0);
      }
      break;

    case Rsrv.XT_ARRAY_DOUBLE:
      const vDouble = value as number | number[];
      if (typeof vDouble === "number") {
        write_view.setFloat64(payload_start, vDouble);
      } else {
        for (i = 0; i < vDouble.length; i++) {
          write_view.setFloat64(payload_start + 8 * i, vDouble[i]);
        }
      }
      break;

    case Rsrv.XT_RAW:
      const vRaw = value as ArrayBuffer;
      read_view = new EndianAwareDataView(vRaw);
      write_view.setUint32(payload_start, vRaw.byteLength);
      for (i = 0; i < vRaw.byteLength; ++i) {
        write_view.setUint8(payload_start + 4 + i, read_view.getUint8(i));
      }
      break;

    case Rsrv.XT_VECTOR:
    case Rsrv.XT_LANG_NOTAG:
      const vVector = value as Array<string | boolean | number>;
      current_offset = payload_start;
      vVector.forEach((el) => {
        const sz = determine_size(el);
        write_into_view(
          el,
          array_buffer_view.skip(current_offset),
          undefined,
          convert
        );
        current_offset += sz;
      });
      break;

    case Rsrv.XT_VECTOR | Rsrv.XT_HAS_ATTR:
      const vFun = value as object;
      current_offset = payload_start + 8;
      Object.keys(vFun).forEach((el) => {
        for (i = 0; i < el.length; ++i, ++current_offset) {
          write_view.setUint8(current_offset, el.charCodeAt(i));
        }
        write_view.setUint8(current_offset++, 0);
      });
      write_view.setUint32(
        payload_start + 4,
        Rsrv.XT_ARRAY_STR + ((current_offset - (payload_start + 8)) << 8)
      );

      write_view.setUint32(current_offset, Rsrv.XT_SYMNAME + (8 << 8));
      current_offset += 4;
      lbl = "names";
      for (i = 0; i < lbl.length; ++i, ++current_offset) {
        write_view.setUint8(current_offset, lbl.charCodeAt(i));
      }
      current_offset += 3;

      write_view.setUint32(
        payload_start,
        Rsrv.XT_LIST_TAG + ((current_offset - (payload_start + 4)) << 8)
      );

      Object.values(vFun).forEach((el) => {
        const sz = determine_size(el);
        write_into_view(
          el,
          array_buffer_view.skip(current_offset),
          undefined,
          convert
        );
        current_offset += sz;
      });
      break;

    case Rsrv.XT_ARRAY_STR | Rsrv.XT_HAS_ATTR:
      const vObj = value as string;
      const converted_function = convert(vObj);
      current_offset = payload_start + 8;
      const class_name = "javascript_function";
      for (i = 0; i < class_name.length; ++i, ++current_offset) {
        write_view.setUint8(current_offset, class_name.charCodeAt(i));
      }
      write_view.setUint8(current_offset++, 0);
      write_view.setInt32(
        8,
        Rsrv.XT_ARRAY_STR + ((current_offset - (payload_start + 8)) << 8)
      );
      write_view.setUint32(current_offset, Rsrv.XT_SYMNAME + (8 << 8));
      current_offset += 4;
      lbl = "class";
      for (i = 0; i < lbl.length; ++i, ++current_offset) {
        write_view.setUint8(current_offset, lbl.charCodeAt(i));
      }
      current_offset += 3;
      write_view.setUint32(
        4,
        Rsrv.XT_LIST_TAG + ((current_offset - (payload_start + 4)) << 8)
      );
      for (i = 0; i < converted_function.length; ++i, ++current_offset) {
        write_view.setUint8(current_offset, converted_function.charCodeAt(i));
      }
      write_view.setUint8(current_offset + converted_function.length, 0);
      break;

    default:
      throw new RserveError("Internal error, can't handle type " + t);
  }
}
