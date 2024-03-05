import {
  EndianAwareDataView,
  type my_ArrayBufferView,
} from "./ArrayBufferView";
import Robj, { Attributes, RObject } from "./Robj";
import RserveError from "./RserveError";
import Rsrv, { RsrvXT } from "./Rsrv";

const decodeRString = (s: string) => {
  // R encodes NA as a string containing just 0xff
  if (s.length === 1 && s.charCodeAt(0) === 255) {
    return null;
  }
  // UTF-8 to UTF-16
  // http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
  // also, we don't want to lose the value when reporting an error in decoding
  try {
    return decodeURIComponent(encodeURIComponent(s));
  } catch (xep) {
    throw new Error("Invalid UTF8: " + s);
  }
};

type ReadHandlerArray = {
  [key in number]: (
    attributes: Attributes,
    length: number
  ) => [RObject<any>, number];
};

type ReadResult = {
  offset: number;
  data_view: EndianAwareDataView;
  msg: my_ArrayBufferView;
};

const read = (m: my_ArrayBufferView) => {
  let handlers: ReadHandlerArray = [];

  const lift = <T>(
    f: (attributes: Attributes, length: number) => T,
    amount?: number
  ): ((attributes: Attributes, length: number) => [T, number]) => {
    return (attributes: Attributes, length: number): [T, number] => [
      f(attributes, length),
      amount ?? length,
    ];
  };

  const bind =
    <T, K>(
      m: (attributes: Attributes, length: number) => [T, number],
      f: (value: T) => (attributes: Attributes, length: number) => [K, number]
    ) =>
    (attributes: Attributes, length: number): [K, number] => {
      const t = m.call(result, attributes, length);
      const t2 = f(t[0])(attributes, length - t[1]);
      return [t2[0], t[1] + t2[1]];
    };

  const unfold =
    <T>(f: (attributes: Attributes, length: number) => [T, number]) =>
    (attributes: Attributes, length: number): [T[], number] => {
      const result: T[] = [];
      const old_length = length;
      while (length > 0) {
        const t = f.call(result, attributes, length);
        result.push(t[0]);
        length -= t[1];
      }
      return [result, old_length];
    };

  // replace 'that' with 'result';
  let result: ReadResult = {
    offset: 0,
    // data_view: new EndianAwareDataView(m.buffer),
    data_view: m.make(EndianAwareDataView),
    msg: m,
  };

  const read_int = () => {
    const old_offset = result.offset;
    result.offset += 4;
    return result.data_view.getInt32(old_offset);
  };
  const read_string = (length: number) => {
    let res = "";
    while (length--) {
      const c = result.data_view.getInt8(result.offset++);
      if (c) res = res + String.fromCharCode(c);
    }
    return decodeRString(res);
  };
  const read_stream = (length: number) => {
    const old_offset = result.offset;
    result.offset += length;
    return result.msg.view(old_offset, length);
  };
  const read_int_vector = (length: number) => {
    const old_offset = result.offset;
    result.offset += length;
    return result.msg.make(Int32Array, old_offset, length);
  };
  const read_double_vector = (length: number) => {
    console.log("READ_DOUBLE_VECTOR - LENGTH: ", length);
    const old_offset = result.offset;
    result.offset += length;
    console.log("THIS MESSAGE: ", result.msg);
    return result.msg.make(Float64Array, old_offset, length);
  };
  //////////////////////////////////////////////////////////////////////
  // these are members of the reader monad
  const read_null = lift((a: Attributes, l: number) => {
    return Robj.null(a);
  });
  const read_unknown = lift((a: Attributes, l: number) => {
    result.offset += l;
    return Robj.null(a);
  });
  const read_string_array = (attributes: Attributes, length: number) => {
    const a = read_stream(length).make(Uint8Array);
    const res: (string | null)[] = [];
    let current_str: string | null = "";
    for (let i = 0; i < a.length; ++i) {
      if (a[i] === 0) {
        current_str = decodeRString(current_str);
        res.push(current_str);
        current_str = "";
      } else {
        current_str += String.fromCharCode(a[i]);
      }
    }
    return [Robj.string_array(res, attributes), length] as [
      RObject<any>,
      number
    ];
  };
  const read_bool_array = (attributes: Attributes, length: number) => {
    const l2 = read_int();
    const s = read_stream(length - 4);
    const a = s
      .make(Uint8Array)
      .subarray(0, 12)
      .map((v) => (v ? 1 : 0));
    return [Robj.bool_array(a, attributes), length] as [RObject<any>, number];
  };
  const read_raw = (attributes: Attributes, length: number) => {
    const l2 = read_int();
    const s = read_stream(length - 4);
    const a = new Uint8Array(s.make(Uint8Array).subarray(0, 12)).buffer;
    return [Robj.raw(a, attributes), length] as [RObject<any>, number];
  };
  const read_sexp = (): [RObject<any>, number] => {
    const d = read_int();
    console.log("READ_SEXP - D: ", d);
    let [t, l] = Rsrv.par_parse(d);
    console.log("READ_SEXP - [t, l]: ", [t, l]);
    let total_read = 4;
    let attributes: any;

    if (Rsrv.IS_LARGE(t)) {
      console.log("ITS LARGE");
      const extra_length = read_int();
      total_read += 4;
      l += extra_length * Math.pow(2, 24);
      t &= ~64;
    }

    if (t & Rsrv.XT_HAS_ATTR) {
      console.log("HAS ATTR");
      t = t & ~Rsrv.XT_HAS_ATTR;
      const attr_result = read_sexp();
      attributes = attr_result[0];
      total_read += attr_result[1];
      l -= attr_result[1];
    }

    if (!handlers[t]) {
      throw new RserveError("Unimplemented " + t, -1);
    }
    console.log("HANDLER: ", handlers[t]);
    const res = handlers[t].call(result, attributes, l);
    console.log("RES: ", res);
    return [res[0], total_read + res[1]];
  };

  const read_clos = bind(read_sexp, (formals: RObject<any>) =>
    bind(read_sexp, (body: RObject<any>) =>
      lift((a, l) => Robj.clos(formals, body, a), 0)
    )
  );

  const read_list = unfold(read_sexp);

  const read_symbol_value_pairs = <T>(lst: RObject<T>[]) => {
    let res: { name: string | null; value: RObject<T> }[] = [];
    for (let i = 0; i < lst.length; i += 2) {
      const value = lst[i],
        tag = lst[i + 1];
      if (tag.type === "symbol") {
        res.push({
          name: tag.value as string,
          value: value,
        });
      } else {
        res.push({
          name: null,
          value: value,
        });
      }
      return res;
    }
  };

  const read_list_tag = bind(read_list, (lst: RObject<any>[]) =>
    lift((attributes: Attributes, length: number) => {
      const res = read_symbol_value_pairs(lst);
      return Robj.tagged_lang(res, attributes);
    }, 0)
  );
  const read_lang_tag = bind(read_list, (lst: RObject<any>[]) =>
    lift((attributes: Attributes, length: number) => {
      const res = read_symbol_value_pairs(lst);
      return Robj.tagged_lang(res, attributes);
    }, 0)
  );

  const xf = <T extends [RObject<any>, number], L>(
    f: (attributes: Attributes, length: number) => [T, number],
    g: (t: T, a: Attributes) => L
  ) => bind(f, (t) => lift((a, l) => g(t, a), 0));
  const read_vector = xf(read_list, Robj.vector);
  const read_list_no_tag = xf(read_list, Robj.list);
  const read_lang_no_tag = xf(read_list, Robj.lang);
  const read_vector_exp = xf(read_list, Robj.vector_exp);

  const sl = <T, L>(f: (l: number) => T, g: (x: T, a: Attributes) => L) =>
    lift((a, l) => g(f(l), a));
  const read_symname = sl(read_string, Robj.symbol);
  const read_int_array = sl(read_int_vector, Robj.int_array);
  const read_double_array = sl(read_double_vector, Robj.double_array);

  handlers[Rsrv.XT_NULL] = read_null;
  handlers[Rsrv.XT_UNKNOWN] = read_unknown;
  handlers[Rsrv.XT_VECTOR] = read_vector;
  handlers[Rsrv.XT_CLOS] = read_clos;
  handlers[Rsrv.XT_SYMNAME] = read_symname;
  handlers[Rsrv.XT_LIST_NOTAG] = read_list_no_tag;
  handlers[Rsrv.XT_LIST_TAG] = read_list_tag;
  handlers[Rsrv.XT_LANG_NOTAG] = read_lang_no_tag;
  handlers[Rsrv.XT_LANG_TAG] = read_lang_tag;
  handlers[Rsrv.XT_VECTOR_EXP] = read_vector_exp;
  handlers[Rsrv.XT_ARRAY_INT] = read_int_array;
  handlers[Rsrv.XT_ARRAY_DOUBLE] = read_double_array;
  handlers[Rsrv.XT_ARRAY_STR] = read_string_array;
  handlers[Rsrv.XT_ARRAY_BOOL] = read_bool_array;
  handlers[Rsrv.XT_RAW] = read_raw;

  handlers[Rsrv.XT_STR] = sl(read_string, Robj.string);

  return {
    read_int,
    read_string,
    read_stream,
    read_int_vector,
    read_double_vector,
    read_null,
    read_unknown,
    read_string_array,
    read_bool_array,
    read_raw,
    read_sexp,
    read_clos,
    read_list,
    read_list_tag,
    read_lang_tag,
    read_vector,
    read_list_no_tag,
    read_lang_no_tag,
    read_vector_exp,
    read_symname,
    read_int_array,
    read_double_array,
  };
};

export default read;
