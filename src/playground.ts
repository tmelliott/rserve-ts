// import { make_basic } from "./Robj";
import _ from "underscore";
import Rsrv from "./Rsrv";
import WebSocket from "ws";

// order
// begin
// robj
// rsrv
// parse
// endian_aware_dataview
// rserve
// error
// write

type CreateOptions = {
  host: string;
  on_connect?: () => void;
  on_error?: (message: string, code: number) => void;
  on_close?: (msg: string) => void;
  login?: string;
  debug?: {
    message_in?: (msg: string) => void;
    message_out?: (buffer: ArrayBuffer, command: any) => void;
  };
  on_raw_string?: (msg: string) => void;
  on_data?: (payload: any) => void; // (return type of parse_websocket_frame).payload
  on_oob_message?: (
    payload: any,
    callback: (message: string, error: string) => void
  ) => void;
};

type CapturedFunctions = {
  [key: string]: any;
};

type Message = {
  data: any;
};

type ResultCB = (result: any) => void;
type Callback = (error: any, result?: any) => void;
type QueueItem = {
  buffer: ArrayBuffer;
  callback: Callback;
  command: string;
  timestamp: number;
};
type Queue = {
  queue: QueueItem[];
  in_oob_message: boolean;
  result_callback?: Callback;
  awaiting_result: boolean;
  msg_id: number;
  name: string;
};

const _encode_command = (
  command: number,
  buffer: ArrayBuffer | ArrayBuffer[],
  msg_id?: number
) => {
  const buf = Array.isArray(buffer) ? buffer : [buffer];

  const length = buf.reduce((memo, val) => memo + val.byteLength, 0);
  const big_buffer = new ArrayBuffer(16 + length);
  // const view = new Rserve.EndianAwareDataView(big_buffer);
  // TODO: view stuff

  let offset = 16;
  buf.forEach((b) => {
    var source_array = new Uint8Array(b);
    for (var i = 0; i < source_array.length; ++i) {
      // view.setUint8(offset + 1, source_array[i]);
    }
    offset += b.byteLength;
  });

  return big_buffer;
};

const _encode_string = (str: string) => {
  const strl = (str.length + 1 + 3) & ~3;
  const payload_length = strl + 4;
  const result = new ArrayBuffer(payload_length);
  // const view = new Rserve.EndianAwareDataView(result);
  // TODO: view stuff

  return result;
};

const _encode_bytes = (bytes: number[]) => {
  const payload_length = bytes.length + 4;
  const header_length = 4;
  const result = new ArrayBuffer(payload_length + header_length);
  // const view = new Rserve.EndianAwareDataView(result);
  // TODO: view stuff

  return result;
};

const create = (opts: CreateOptions) => {
  const host = opts.host;
  const onconnect = opts.on_connect || (() => {});

  const socket = new WebSocket(host);
  socket.binaryType = "arraybuffer";

  const handle_error =
    opts.on_error ||
    ((error: string) => {
      console.log("ERROR: ", error);
      // throw new RserveError(error, -1);
    });

  let received_handshake = false;
  let command_counter = 0;

  let captured_functions: CapturedFunctions = {};

  const fresh_hash = () => {
    let k: string;
    do {
      k = String(Math.random()).slice(2, 12);
    } while (k in captured_functions);
    if (k.length !== 10) throw new Error("Bad rng, no cookie");
    return k;
  };

  const convert_to_hash = (value: any) => {
    var hash = fresh_hash();
    captured_functions[hash] = value;
    return hash;
  };

  const _encode_value = (value: any, forced_type?: any) => {
    const sz = 4; //Rserve.determine_size(value, forced_type);
    const buffer = new ArrayBuffer(sz + 4);
    // var view: BufferView = Rserve.my_ArrayBufferView(buffer);
    // TODO: implement dataview

    return buffer;
  };

  const hand_shake = (message: Message) => {
    const msg = message.data;
    if (typeof msg === "string") {
      if (msg.substring(0, 4) !== "Rsrv") {
        handle_error("server is not an RServe instance", -1);
        return;
      }
      if (msg.substring(4, 8) !== "0103") {
        handle_error(
          "sorry, rserve only speaks the 0103 version of the R server protocol",
          -1
        );
        return;
      }
      if (msg.substring(8, 12) !== "QAP1") {
        handle_error("sorry, rserve only speaks QAP1", -1);
        return;
      }
      received_handshake = true;
      if (opts.login) result.login(opts.login);
      result.running = true;
      onconnect && onconnect.call(result);
      return;
    }

    const view = new DataView(msg);
    const header =
      String.fromCharCode(view.getUint8(0)) +
      String.fromCharCode(view.getUint8(1)) +
      String.fromCharCode(view.getUint8(2)) +
      String.fromCharCode(view.getUint8(3));

    if (header !== "RsOC") {
      handle_error("Unrecognized server answer: " + header, -1);
      return;
    }
    received_handshake = true;
    result.ocap_mode = true;
    // result.bare_ocap = Rserve.parse_payload(msg).value;
    // TODO: result.ocap = Rserve.wrap_ocap(result, result.bare_ocap);
    result.running = true;
    onconnect && onconnect.call(result);
  };

  socket.onclose = (msg: any) => {
    result.running = false;
    result.closed = true;
    opts.on_close && opts.on_close(msg);
  };

  socket.onmessage = (message: Message) => {
    console.log("Message: ", message);
    if (message.data.constructor.name === "Buffer") {
      message.data = new Uint8Array(message.data).buffer;
    }
    if (opts.debug && opts.debug.message_in) {
      opts.debug.message_in(message.data);
    }
    if (!received_handshake) {
      hand_shake(message);
      return;
    }

    if (typeof message.data === "string") {
      opts.on_raw_string && opts.on_raw_string(message.data);
      return;
    }

    // const v = Rserve.parse_websocket_frame(message.data);
    // TODO: finish this
  };

  // TODO: might need to handle ArrayBuffer | ArrayBuffer[]
  const _send_cmd_now = (
    command: any,
    buffer: ArrayBuffer[],
    msg_id?: number
  ) => {
    const big_buffer = _encode_command(command, buffer, msg_id);
    if (opts.debug && opts.debug.message_out) {
      opts.debug.message_out(big_buffer, command);
    }
    socket.send(big_buffer);
    return big_buffer;
  };

  const ctrl_queue: Queue = {
    queue: [],
    in_oob_message: false,
    awaiting_result: false,
    msg_id: 0,
    name: "control",
  };
  // result_callback: ResultCB,

  const compute_queue: Queue = {
    queue: [],
    in_oob_message: false,
    awaiting_result: false,
    msg_id: 1,
    name: "compute",
  };

  const queues = [ctrl_queue, compute_queue];

  const queue_can_send = (queue: Queue) => {
    return (
      !queue.in_oob_message && !queue.awaiting_result && queue.queue.length > 0
    );
  };

  const bump_queues = () => {
    const available = queues.filter(queue_can_send);
    if (available.length === 0) return;

    if (result.closed) {
      handle_error("Cannot send messages on a closed socket!", -1);
      return;
    }

    const queue = available.sort(
      (a, b) => a.queue[0].timestamp - b.queue[0].timestamp
    )[0];

    // .shift() may return undefined, but we know that queue.queue.length > 0
    // so typescript needs some help
    const lst = queue.queue.shift() as QueueItem;
    queue.result_callback = lst.callback;
    queue.awaiting_result = true;

    if (opts.debug && opts.debug.message_out) {
      opts.debug.message_out(lst.buffer, lst.command);
    }
    socket.send(lst.buffer);
  };

  const enqueue = (
    buffer: ArrayBuffer,
    k: Callback,
    command: string,
    queue: Queue
  ) => {
    queue.queue.push({
      buffer,
      callback: (error: any, result: any) => {
        queue.awaiting_result = false;
        bump_queues();
        k(error, result);
      },
      command,
      timestamp: Date.now(),
    });
    bump_queues();
  };

  const _cmd = (
    command: number,
    buffer: ArrayBuffer | ArrayBuffer[],
    k: Callback | undefined,
    string: string,
    queue?: Queue
  ) => {
    if (!queue) queue = queues[0];

    const big_buffer = _encode_command(command, buffer, queue.msg_id);
    return enqueue(big_buffer, k || (() => {}), string || "", queue);
  };

  const result = {
    ocap_mode: false,
    running: false,
    closed: false,
    close: () => socket.close(),

    // non-ocap mode
    login: (command: string, k?: Callback) => {
      _cmd(Rsrv.CMD_login, _encode_string(command), k, command);
    },
    eval: (command: string, k?: Callback) => {
      _cmd(Rsrv.CMD_eval, _encode_string(command), k, command);
    },
    createFile: (command: string, k?: Callback) => {
      _cmd(Rsrv.CMD_createFile, _encode_string(command), k, command);
    },
    writeFile: (chunk: number[], k?: Callback) => {
      _cmd(Rsrv.CMD_writeFile, _encode_bytes(chunk), k, "");
    },
    closeFile: (k?: Callback) => {
      _cmd(Rsrv.CMD_closeFile, new ArrayBuffer(0), k, "");
    },
    set: (key: string, value: any, k?: Callback) => {
      _cmd(
        Rsrv.CMD_setSEXP,
        [_encode_string(key), _encode_value(value)],
        k,
        ""
      );
    },

    // ocap mode
    OCcall: (ocap: Ocap, values: any, k: Callback) => {
      let is_ocap = false,
        str = "";
      try {
        is_ocap = ocap.r_attributes["class"] === "OCref";
        str = ocap[0];
      } catch (e) {}

      if (!is_ocap) {
        try {
          is_ocap = values.attributes.value[0].value.value[0] === "OCref";
          str = ocap.value[0];
        } catch (e) {}
      }

      if (!is_ocap) {
        k(new Error("Expected an ocap, instead got " + ocap));
        return;
      }

      const params = [str];
      params.push.apply(params, values);
      const queue = str.charCodeAt(0) == 64 ? compute_queue : ctrl_queue;
      _cmd(
        Rsrv.CMD_OCcall,
        _encode_value(params, Rsrv.XT_LANG_NOTAG),
        k,
        "",
        queue
      );
    },
    wrap_ocap: (ocap: Ocap) => {
      // return wrap_ocap()
    },
    resolve_hash: (hash: string) => {
      if (!(hash in captured_functions)) {
        throw new Error("hash: " + hash + " not found");
      }
      return captured_functions[hash];
    },
  };

  return result;
};

type Payload = {
  type: string;
  value: any;
};

type WSframe = {
  header: any;
  ok: boolean;
  incomplete: boolean;
  message: string;
  payload: Payload;
};

const wrap_all_ocaps = (s: ReturnType<typeof create>, v: Payload) => {
  const replace = (obj: any[] & { r_attributes: any; r_type: string }) => {
    let result: any = obj;
    if (
      Array.isArray(obj) &&
      obj.r_attributes &&
      obj.r_attributes["class"] === "OCref"
    ) {
      return wrap_ocap(s, obj);
    }

    if (Array.isArray(obj)) {
      result = obj.map((x) => replace(x));
      result.r_type = obj.r_type;
      result.r_attributes = obj.r_attributes;
    } else if (_.isTypedArray(obj)) {
      return obj;
    } else if (_.isFunction(obj)) {
      return obj;
      // TODO: fix all this typing
      // } else if (obj && obj.byteLength !== undefined && obj.slice !== undefined) {
      //   return obj;
    } else if (_.isObject(obj)) {
      // TODO: fix
      result = Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, replace(v as Ocap)])
      );
    }

    return result;
  };

  return replace(v.value.json(s.resolve_hash));
};

const wrap_ocap = (s: ReturnType<typeof create>, ocap: Ocap) => {
  const wrapped_ocap = (...values: any[]) => {
    if (
      values.length === 0 ||
      typeof values[values.length - 1] !== "function"
    ) {
      throw new Error("forgot to pass continuation to ocap");
    }

    const k = values.pop();
    s.OCcall(ocap, values, (err: any, v: Ocap) => {
      if (v) v = wrap_all_ocaps(s, v);
      k(err, v);
    });
  };

  wrapped_ocap.bare_ocap = ocap;
  return wrapped_ocap;
};

type Ocap = any;

//   r_attributes: {
//     class: string;
//   };
//   value: any;
// };

const Rserve = {
  // Robj: {},
  // Rsrv: Rsrv,
  create: create,
};

console.log(
  create({
    host: "http://localhost:8081",
    on_connect: () => {
      console.log("Connected");
    },
  })
);

// type Basic = {
//   name: string;
//   json: (this: Basic) => void;
// };
// // type Method = {
// //   json: () => void;
// // };
// const make_basic = (name: string, methods: Pick<Basic, "json">) => {
//   return {
//     name: name,
//     json: methods.json,
//   };
// };

// const dbl = make_basic("double_array", {
//   json: function () {
//     if (this.value.length === 1 && this.attributes === undefined)
//       return this.value[0];
//     else return this.value;
//   },
// });

// console.log(dbl([1, 2, 3]).json());
// console.log(dbl([1]).json());

// let x: any = [1, 2, 3];
// x.attr = "hello";
// console.log(x);

// let y: any = 1;
// y.attr = "hello";
// console.log(y);
