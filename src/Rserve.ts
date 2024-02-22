import WebSocket from "ws";
import { RsrvCommandCode } from "./Rsrv";
import RserveError from "./RserveError";
import { parse_websocket_frame } from "./parse";

type RserveOptions = {
  host: string;
  on_connect?: () => void;
  on_error?: (message: string, code?: number) => void;
  on_close?: (event: WebSocket.CloseEvent) => void;

  //   login?: string;
  //   debug?: {
  //     message_in?: (msg: string) => void;
  //     message_out?: (buffer: ArrayBuffer, command: any) => void;
  //   };
  //   on_raw_string?: (msg: string) => void;
  //   on_data?: (payload: any) => void; // (return type of parse_websocket_frame).payload
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

type Callback = (err: Error | null, data: any) => void;

type Rserve = {
  ocap_mode: boolean;
  running: boolean;
  closed: boolean;
  close: () => void;
  login: (command: RsrvCommandCode, k: Callback) => void;
};

type CaptureFunctions = {
  [key: string]: any;
};

const create = (opts: RserveOptions) => {
  const host = opts.host || "http://127.0.0.1:8081";
  const onconnect = opts.on_connect || (() => {});

  const socket = new WebSocket(host);
  socket.binaryType = "arraybuffer";

  const handle_error =
    opts.on_error ||
    ((error: string) => {
      throw new RserveError(error, -1);
    });

  let received_handshake = false;
  let result: Rserve;
  let command_counter = 0;

  const captured_functions: CaptureFunctions = [];
  const fresh_hash = () => {
    let k;
    do {
      k = Math.random().toString(36).substring(2);
    } while (captured_functions[k]);
    if (k.length !== 10) throw new Error("Bad rng, no cookie");
    return k;
  };

  const convert_to_hash = (value: any) => {
    var hash = fresh_hash();
    captured_functions[hash] = value;
    return hash;
  };

  const hand_shake = (event: WSMessageEvent) => {
    if (typeof event.data === "string") {
      console.log("Received string:", event.data);

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

  socket.onmessage = (message: WebSocket.MessageEvent) => {
    // node.js Buffer vs ArrayBuffer workaround
    const msg = asBuffer(message);

    if (!received_handshake) {
      hand_shake(msg);
      return;
    }

    if (typeof msg.data === "string") {
      console.log("Raw string: ", msg.data);
      return;
    }

    const v = parse_websocket_frame(msg.data);
    if (v.incomplete) return;

    const msg_id = v.header[2],
      cmd = v.header[0] & 0xffffff;

    console.log(v);
  };

  result = {
    running: false,
    closed: false,
    ocap_mode: false,
    close: () => {
      socket.close();
    },
    login: (command, k) => {
      // const buffer = Rsrv.create_command(command);
      // socket.send(buffer);
      // k(null, "logged in");
    },
  };
};

var s = create({ host: "ws://localhost:8081", on_connect: test });

function test() {
  console.log("starting tests");
}
