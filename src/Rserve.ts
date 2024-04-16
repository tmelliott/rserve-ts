import WebSocket from "ws";
import Rsrv from "./Rsrv";
import RserveError from "./RserveError";
import { Payload, parse_websocket_frame } from "./parse";
import { EndianAwareDataView, my_ArrayBufferView } from "./ArrayBufferView";
import { Rtype, determine_size, write_into_view } from "./utils";
import { RObject } from "./Robj";
import { debug } from "./utils";

type RserveOptions = {
  host: string;
  on_connect?: () => void;
  on_error?: (message: string, code?: number) => void;
  on_close?: (event: WebSocket.CloseEvent) => void;

  //   login?: string;
  debug?: {
    message_in?: (msg: string) => void;
    message_out?: (buffer: ArrayBuffer, command: any) => void;
  };
  //   on_raw_string?: (msg: string) => void;
  on_data?: <TData>(payload: Payload<TData>) => void; // (return type of parse_websocket_frame).payload
  //   on_oob_message?: (
  //     payload: any,
  //     callback: (message: string, error: string) => void
  //   ) => void;
};

const isBuffer = (data: WebSocket.Data): data is Buffer => {
  return data.constructor.name === "Buffer";
};

const asBuffer = (message: WebSocket.MessageEvent) => {
  if (isBuffer(message.data)) {
    message.data = new Uint8Array(message.data).buffer;
  }
  return message as WSMessageEvent;
};

type WSMessageEvent = Omit<WebSocket.MessageEvent, "data"> & {
  data: ArrayBuffer | string;
};

type Callback<T = any> = (
  err: Error | [string, number?] | null,
  data: T extends RObject<any> ? Payload<T> : null | undefined
) => void;

type Rserve = {
  ocap_mode: boolean;
  running: boolean;
  closed: boolean;
  close: () => void;
  login: (command: string, k: Callback<null>) => void;
  eval: <TResult>(command: string) => Promise<Payload<TResult>>;
  createFile: (command: string, k: Callback<null>) => void;
  writeFile: (chunk: number[], k: Callback<null>) => void;
  closeFile: (k: Callback<null>) => void;
  set: (key: string, value: Rtype) => Promise<void>;
  resolve_hash: (hash: string) => any; // TODO: does this need exporting?
};

type CaptureFunctions = {
  [key: string]: string;
};

type Job = {
  buffer: ArrayBuffer;
  callback: Callback;
  command: string;
  timestamp: number;
};

type Queue = {
  queue: Job[];
  in_oob_message: boolean;
  awaiting_result: boolean;
  result_callback?: Callback;
  msg_id: number;
  name: "control" | "compute";
};

const _encode_command = (
  command: number,
  buffer: ArrayBuffer | ArrayBuffer[],
  msg_id?: number
) => {
  // if buffer is not an array, make it one
  if (!Array.isArray(buffer)) buffer = [buffer];

  if (!msg_id) msg_id = 0;
  var length = buffer.reduce(function (memo, val) {
    return memo + val.byteLength;
  }, 0);
  debug(
    "command: ",
    command,
    ", msg_id: ",
    msg_id,
    ", length: ",
    length,
    ", buffer: ",
    buffer
  );
  const big_buffer = new ArrayBuffer(16 + length);
  debug(big_buffer);
  const view = new EndianAwareDataView(big_buffer);
  debug(view.view);
  view.setInt32(0, command);
  view.setInt32(4, length);
  view.setInt32(8, msg_id);
  view.setInt32(12, 0);

  var offset = 16;
  buffer.forEach(function (b) {
    var source_array = new Uint8Array(b);
    for (var i = 0; i < source_array.byteLength; ++i)
      view.setUint8(offset + i, source_array[i]);
    offset += b.byteLength;
  });
  debug("big_buffer", big_buffer);
  debug(view.view);

  return big_buffer;
};

function _encode_string(str: string) {
  // debug("ENCODING STRING: ", str);
  var strl = (str.length + 1 + 3) & ~3; // pad to 4-byte boundaries.
  // debug("strl: ", strl, ", str.length: ", str.length, ", str: ", str);
  var payload_length = strl + 4;
  var result = new ArrayBuffer(payload_length);
  // debug(result);
  var view = new EndianAwareDataView(result);
  // debug("VIEW: ", view.view);
  view.setInt32(0, Rsrv.DT_STRING + (strl << 8));
  for (var i = 0; i < str.length; ++i) view.setInt8(4 + i, str.charCodeAt(i));

  // debug("string: ", str);
  // debug("result: ", result);
  return result;
}

function _encode_bytes(bytes: number[]) {
  var payload_length = bytes.length;
  var header_length = 4;
  var result = new ArrayBuffer(payload_length + header_length);
  var view = new EndianAwareDataView(result);
  view.setInt32(0, Rsrv.DT_BYTESTREAM + (payload_length << 8));
  for (var i = 0; i < bytes.length; ++i) view.setInt8(4 + i, bytes[i]);
  return result;
}

const create = async (opts: RserveOptions) => {
  return new Promise<Rserve>((resolve, reject) => {
    const host = opts.host ?? "http://127.0.0.1:8081";
    const onconnect = () => {
      debug("CONNECTING ...");
      resolve(result);
      opts.on_connect && opts.on_connect();
    };

    const socket = new WebSocket(host);
    socket.binaryType = "arraybuffer";

    socket.on("send", (data: ArrayBuffer) => {
      debug("sending data", data);
    });

    const handle_error =
      opts.on_error ??
      ((error: string) => {
        throw new RserveError(error, -1);
      });

    let received_handshake = false;
    let result: Rserve;
    let command_counter = 0;

    const ctrl_queue: Queue = {
      queue: [],
      in_oob_message: false,
      awaiting_result: false,
      msg_id: 0,
      name: "control",
    };

    const compute_queue: Queue = {
      queue: [],
      in_oob_message: false,
      awaiting_result: false,
      msg_id: 0,
      name: "compute",
    };

    const queues = [ctrl_queue, compute_queue];

    const queue_can_send = (queue: Queue) =>
      !queue.in_oob_message && !queue.awaiting_result && queue.queue.length > 0;

    const bump_queues = () => {
      // debug("bumping queue");
      const available = queues.filter(queue_can_send);
      if (available.length === 0) return;
      if (result.closed) {
        handle_error("Cannot send messages on a closed socket!", -1);
        return;
      }
      const q = available.sort(
        (a, b) => a.queue[0].timestamp - b.queue[0].timestamp
      )[0];
      // can we be sure that the queue is not empty?
      const lst = q.queue.shift() as Job;
      q.result_callback = lst.callback;
      q.awaiting_result = true;
      if (opts.debug)
        opts.debug.message_out &&
          opts.debug.message_out(lst.buffer, lst.command);

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
        callback: (error, result) => {
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
      buffer:
        | ArrayBuffer
        | [ReturnType<typeof _encode_string>, ReturnType<typeof _encode_value>],
      k: Callback,
      string: string,
      queue?: Queue
    ) => {
      if (!queue) queue = queues[0];
      k = k ?? (() => {});
      const big_buffer = _encode_command(command, buffer, queue.msg_id);
      return enqueue(big_buffer, k, string, queue);
    };

    const _send_cmd_now = (
      command: number,
      buffer: ArrayBuffer,
      msg_id?: number
    ) => {
      var big_buffer = _encode_command(command, buffer, msg_id);
      // if (opts.debug)
      //   opts.debug.message_out && opts.debug.message_out(big_buffer[0], command);
      socket.send(big_buffer);
      return big_buffer;
    };

    const captured_functions: CaptureFunctions = {};
    const fresh_hash = () => {
      let k;
      do {
        k = Math.random().toString(36).substring(2);
      } while (captured_functions[k]);
      if (k.length !== 10) throw new Error("Bad rng, no cookie");
      return k;
    };

    const convert_to_hash = (value: string) => {
      var hash = fresh_hash();
      captured_functions[hash] = value;
      return hash;
    };

    const _encode_value = (value: Rtype, forced_type?: number) => {
      const sz = determine_size(value, forced_type);
      // debug("ENCODE VALUE: SZ = ", sz);
      if (sz > 16777215) {
        const buffer = new ArrayBuffer(sz + 8);
        const view = my_ArrayBufferView(buffer);
        view
          .data_view()
          .setInt32(
            0,
            Rsrv.DT_SEXP + (sz & 16777215) * Math.pow(2, 8) + Rsrv.DT_LARGE
          );
        view.data_view().setInt32(4, sz >>> 24);
        write_into_view(value, view.skip(8), forced_type, convert_to_hash);
        return buffer;
      }
      const buffer = new ArrayBuffer(sz + 4);
      // debug("LE BUFFERRR: ", buffer);
      const view = my_ArrayBufferView(buffer);
      // debug("LE VIEWWWW: ", view);
      view.data_view().setInt32(0, Rsrv.DT_SEXP + (sz << 8));
      // debug("LE VIEWWWW again: ", view);
      write_into_view(value, view.skip(4), forced_type, convert_to_hash);
      // debug("ENCODE VALUE: ", buffer);
      return buffer;
    };

    const hand_shake = (event: WSMessageEvent) => {
      if (typeof event.data === "string") {
        debug("Received string:", event.data);

        const id = event.data;
        const RserverID = id.slice(0, 4);
        if (RserverID !== "Rsrv") {
          throw new Error("Server is not an Rserve instance");
        }
        const protocolVersion = id.slice(4, 8);
        if (protocolVersion !== "0103") {
          throw new Error(
            "Sorry, Rserve only speaks the 0103 version of the R server protocol"
          );
        }
        const protocol = id.slice(8, 12);
        if (protocol !== "QAP1") {
          throw new Error("Sorry, Rserve only speaks QAP1");
        }
        //   const additionalAttributes = id.slice(12);

        received_handshake = true;
        result.running = true;
        onconnect && onconnect.call(result);
        return;
      }

      const view = new DataView(event.data);
      const header =
        String.fromCharCode(view.getUint8(0)) +
        String.fromCharCode(view.getUint8(1)) +
        String.fromCharCode(view.getUint8(2)) +
        String.fromCharCode(view.getUint8(3));

      if (header !== "RsOC") {
        handle_error("Unrecognised server answer: " + header, -1);
      }

      received_handshake = true;
      result.ocap_mode = true;
      result.running = true;
      onconnect && onconnect.call(result);
    };

    socket.onclose = (event) => {
      result.running = false;
      result.closed = true;
      opts.on_close && opts.on_close(event);
    };

    socket.onopen = function (e) {
      debug("[open] Connection established");
    };

    socket.onclose = function (event) {
      if (event.wasClean) {
        debug(
          `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
        );
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        debug("[close] Connection died");
        reject();
      }
    };

    socket.onerror = function (error) {
      debug(`[error]`);
    };

    socket.onmessage = (message) => {
      debug(`[message] Data received from server: ${message.data}`);

      // debug("Message: ", message);
      // debug("message received");

      // node.js Buffer vs ArrayBuffer workaround
      const msg = asBuffer(message);
      // debug(msg);

      // debug("Recevied handshake: ", received_handshake);

      if (!received_handshake) {
        hand_shake(msg);
        return;
      }

      if (typeof msg.data === "string") {
        debug("Raw string: ", msg.data);
        return;
      }

      // debug("PArsing ...\n");
      const v = parse_websocket_frame(msg.data);
      // debug(v);
      if (v.incomplete) return;

      const msg_id = v.header[2],
        cmd = v.header[0] & 0xffffff;

      // debug(v.header);
      // debug("cmd: ", cmd);

      let q = queues.find((q) => q.msg_id === msg_id) ?? queues[0];
      if (!v.ok) {
        q.result_callback!([v.message, v.status_code], undefined);
      } else if (cmd === Rsrv.RESP_OK) {
        // debug(q);
        q.result_callback!(null, v.payload);
      } else if (Rsrv.IS_OOB_SEND(cmd)) {
        // opts.on_data && opts.on_data(v.payload);
      } else if (Rsrv.IS_OOB_MSG(cmd)) {
        q = Rsrv.OOB_USR_CODE(cmd) > 255 ? compute_queue : ctrl_queue;
        let p: any[] = [];
        try {
          // p = wrap_all_ocaps(result, v.payload)
        } catch (e) {
          _send_cmd_now(Rsrv.RESP_ERR | cmd, _encode_string(String(e)), msg_id);
          return;
        }
        if (typeof p[0] === "string") {
          if (false) {
            //!opts.on_oob_message) {
            // handle
          } else {
            q.in_oob_message = true;
            // opts.on_oob_message(p, (message, error)
          }
        } else if (typeof p[0] === "function") {
          if (!result.ocap_mode) {
            _send_cmd_now(
              Rsrv.RESP_ERR | cmd,
              _encode_string(
                "JavaScript function calls only allowed in ocap mode"
              ),
              msg_id
            );
          } else {
            const captured_function = p[0] as Function;
            const params = p.slice(1);
            params.push((err: string | undefined, result: any) => {
              if (err) {
                _send_cmd_now(Rsrv.RESP_ERR | cmd, _encode_string(err), msg_id);
              } else {
                _send_cmd_now(cmd, _encode_value(result), msg_id);
              }
            });
            captured_function.apply(undefined, params);
          }
        } else {
          _send_cmd_now(
            Rsrv.RESP_ERR | cmd,
            _encode_string("Unknown oob message type: " + typeof p[0])
          );
        }
      } else {
        handle_error(
          "Internal Error, parse returned unexpected type " + v.header[0],
          -1
        );
      }
    };

    result = {
      running: false,
      closed: false,
      ocap_mode: false,
      close: () => {
        socket.close();
      },
      login: (command, k) => {
        _cmd(Rsrv.CMD_login, _encode_string(command), k, command);
      },
      eval: (command) => {
        debug("\n\n======================\nEVAL: ", command);
        return new Promise((resolve, reject) => {
          _cmd(
            Rsrv.CMD_eval,
            _encode_string(command),
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                data && resolve(data);
              }
            },
            command
          );
        });
      },
      createFile: (command, k) => {
        _cmd(Rsrv.CMD_createFile, _encode_string(command), k, command);
      },
      writeFile: (chunk, k) => {
        _cmd(Rsrv.CMD_writeFile, _encode_bytes(chunk), k, "");
      },
      closeFile: (k) => {
        _cmd(Rsrv.CMD_closeFile, new ArrayBuffer(0), k, "");
      },
      set: (key, value) => {
        debug("\n\n======================\nSET: ", key, value);
        return new Promise((resolve, reject) => {
          _cmd(
            Rsrv.CMD_setSEXP,
            [_encode_string(key), _encode_value(value)],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            },
            ""
          );
        });
      },
      resolve_hash: (hash: string) => {
        if (!(hash in captured_functions)) {
          throw new Error("hash " + hash + " not found");
        }
        return captured_functions[hash];
      },
    };

    return result;
  });
};

export default create;
