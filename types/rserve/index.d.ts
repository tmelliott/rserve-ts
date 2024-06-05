declare module "rserve" {
  export interface RserveOptions {
    host?: string;
    on_connect?: () => void;
    on_error?: (message: string, code?: number) => void;
    login?: any;
    on_close?: (event: WebSocket.CloseEvent) => void;
    debug?: {
      message_in?: (msg: string) => void;
      message_out?: (buffer: ArrayBuffer, command: any) => void;
    };
    on_raw_string?: (msg: string) => void;
    on_data?: <TPayload>(payload: TPayload) => void;
    on_oob_message?: (
      payload: any,
      callback: (error: string, result: any) => void
    ) => void;
  }

  interface RserveCallback<TResult = null> {
    (err: Error | [string, number?] | null, data: TResult): void;
  }

  type RserveValue =
    | string
    | number
    | boolean
    | ArrayBuffer
    | ArrayBufferView
    | Function;
  type Payload<TResult> = {
    type: string;
    value: TResult;
  };

  type OCAP<TArgs, TResult> = (
    ...args: TArgs,
    k: RserveCallback<TResult>
  ) => void;

  export interface RserveClient {
    ocap_mode: boolean;
    running: boolean;
    closed: boolean;
    close: () => void;

    // CMD_ functions
    login: (command: string, k: RserveCallback) => void;
    eval: <TResult>(
      command: string,
      k: RserveCallback<Payload<TResult>>
    ) => void;
    createFile: (command: string, k: RserveCallback) => void;
    writeFile: (chunk: number[], k: RserveCallback) => void;
    closeFile: (k: RserveCallback) => void;
    set: (key: string, value: string | RserveValue, k: RserveCallback) => void;

    resolve_hash: (hash: string) => any; // TODO: does this need exporting?

    // ocap mode
    ocap: <T>(k: RserveCallback<T>) => void;
  }

  export function create(options: RserveOptions): RserveClient;
}