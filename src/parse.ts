import { debug } from "./utils";
import { my_ArrayBufferView } from "./ArrayBufferView";
import Robj, { RObject } from "./Robj";
import RserveError from "./RserveError";
import Rsrv, { RsrvStatusCode } from "./Rsrv";
import read from "./reader";

type ResultHeader = Int32Array; //Array<number>;

type ParseResult = {
  header: ResultHeader;
  ok: boolean;
  message: string;
  incomplete?: boolean;
  status_code?: RsrvStatusCode;
  payload?: Payload | null;
};

let incomplete_: ArrayBuffer[] = [];
let incomplete_header_: ResultHeader | null = null;
let msg_bytes_ = 0;
let remaining_ = 0;

const clear_incomplete = () => {
  incomplete_ = [];
  incomplete_header_ = null;
  msg_bytes_ = 0;
  remaining_ = 0;
};

const parse_websocket_frame = (msg: ArrayBuffer): ParseResult => {
  const result: Partial<ParseResult> = {};

  if (incomplete_.length) {
    result.header = incomplete_header_ as ResultHeader;
    incomplete_.push(msg);
    remaining_ -= msg.byteLength;
    if (remaining_ < 0) {
      result.ok = false;
      result.message =
        "Messages add up to more than expected length: got " +
        (msg_bytes_ - remaining_) +
        ", expected " +
        msg_bytes_;
      clear_incomplete();
      return result as ParseResult;
    }

    if (remaining_ === 0) {
      const complete_msg = new ArrayBuffer(msg_bytes_);
      const array = new Uint8Array(complete_msg);
      let offset = 0;

      incomplete_.map((frame, i) => {
        array.set(new Uint8Array(frame), offset);
        offset += frame.byteLength;
      });

      if (offset !== msg_bytes_) {
        result.ok = false;
        result.message =
          "Internal error = frames added up to " +
          offset +
          " not " +
          msg_bytes_;
        clear_incomplete();
        return result as ParseResult;
      }
      clear_incomplete();
      msg = complete_msg;
    } else {
      result.ok = true;
      result.incomplete = true;
      return result as ParseResult;
    }
  }

  const header = new Int32Array(msg, 0, 4);
  const resp = header[0] & 16777215;
  const status_code = (header[0] >>> 24) as RsrvStatusCode;
  const length = header[1];
  const length_high = header[3];
  const msg_id = header[2];
  result.header = new Int32Array([resp, status_code, msg_id]);

  if (length_high) {
    result.ok = false;
    result.message = "rserve.js cannot handle messages larger than 4GB";
    return result as ParseResult;
  }

  const full_msg_length = length + 16;
  if (full_msg_length > msg.byteLength) {
    incomplete_.push(msg);
    incomplete_header_ = header;
    msg_bytes_ = full_msg_length;
    remaining_ = msg_bytes_ - msg.byteLength;
    result.header = header;
    result.ok = true;
    result.incomplete = true;
    return result as ParseResult;
  }

  if (resp === Rsrv.RESP_ERR) {
    result.ok = false;
    result.status_code = status_code;
    result.message =
      "ERROR FROM R SERVER: " +
      (Rsrv.status_codes[status_code] || status_code) +
      " " +
      result.header[0] +
      " " +
      result.header[1] +
      " " +
      msg.byteLength +
      " " +
      msg;
    return result as ParseResult;
  }

  if (
    !(resp === Rsrv.RESP_OK || Rsrv.IS_OOB_SEND(resp) || Rsrv.IS_OOB_MSG(resp))
  ) {
    result.ok = false;
    result.message =
      "Unexpected reponse from Rserve: " +
      resp +
      " status: " +
      Rsrv.status_codes[status_code];
    return result as ParseResult;
  }

  try {
    result.payload = parse_payload(msg);
    result.ok = true;
  } catch (e) {
    result.ok = false;

    if (typeof e === "string") {
      result.message = e;
    } else if (e instanceof Error) {
      result.message = e.message;
    }
  }

  return result as ParseResult;
};

export type RobjTypes = {
  [K in keyof typeof Robj]: ReturnType<(typeof Robj)[K]> extends RObject<
    infer U1,
    infer U2
  >
    ? { name: K; input: U1; json: U2 }
    : never;
}[keyof typeof Robj];

type z = Extract<RobjTypes, { input: number[] }>["json"];

export type Payload<T = any> = {
  type: string;
  value: T extends RObject<infer U1, infer U2> ? RObject<U1, U2> : T;
};

const parse_payload = (msg: ArrayBuffer): Payload | null => {
  debug("MESSAGE: ", msg);
  debug("MESSAGE LENGTH: ", msg.byteLength);
  const payload = my_ArrayBufferView(msg, 16, msg.byteLength - 16);
  debug("THE PAYLOAD: ", payload);
  if (payload.length === 0) return null;

  const reader = read(payload);
  debug("READER: ", reader);

  const d = reader.read_int();
  debug("D:", d);
  let [t, l] = Rsrv.par_parse(d);
  debug("Par parse: ", t, l);
  if (Rsrv.IS_LARGE(t)) {
    debug("ITS LARGE");
    const more_length = reader.read_int();
    l += more_length * Math.pow(2, 24);
    if (l > Math.pow(2, 32)) {
      throw new Error("Payload too large: " + l + " bytes");
    }
    t &= ~64;
  }

  if (t === Rsrv.DT_INT) {
    return {
      type: "int",
      value: reader.read_int(),
    };
  }
  if (t === Rsrv.DT_STRING) {
    return {
      type: "string",
      value: reader.read_string(l),
    };
  }
  if (t === Rsrv.DT_BYTESTREAM) {
    return {
      type: "stream",
      value: reader.read_stream(l),
    };
  }
  if (t === Rsrv.DT_SEXP) {
    debug("Reading SEXP");
    const [sexp, l2] = reader.read_sexp();
    debug("SEXP: ", sexp, l2);
    return {
      type: "sexp",
      value: sexp,
    };
  }

  throw new RserveError("Bad type for parse? " + t + " " + l, -1);
};

export { parse_websocket_frame, parse_payload };
