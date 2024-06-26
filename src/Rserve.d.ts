export = Rserve;

declare namespace Rserve {
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

  type RObject<
    TType extends string,
    TValue,
    TAttr = undefined,
    TJson = never // takes the input type and ADDS to it ...
  > = {
    type: TType;
    value: TValue;
    json: () => TJson;
    //  & {
    //   r_type: TType;
    // } & (TAttr extends undefined ? {} : { r_attributes: TAttr });
  } & (TAttr extends undefined ? {} : { attributes: TAttr });

  type RNull<A> = {
    type: "null";
    value: null;
    attributes: A;
    json: () => null;
  };
  type RClos<Formals, Body, Attr = undefined> = {
    type: "clos";
    value: {
      formals: Formals;
      body: Body;
    };
    attributes: Attr;
    json: () => never;
  };

  // type RVector<T, A> = RObject<
  //   "vector",
  //   T[],
  //   any[],
  //   readonly A extends undefined
  //     ? T[]
  //     : A extends ReadonlyArray<{
  //         value: {
  //           name: "names";
  //           value: {
  //             type: string;
  //             value: infer U;
  //           };
  //         };
  //       }>
  //     ? { [K in U[number]]: T }
  //     : T[]
  // >;
  // type RSymbol<T, A> = RObject<"symbol", T, A, T>;
  // type RList<T, A> = RObject<"list", T, A, T>;
  // type RLang<T, A> = RObject<"lang", T, A, T>; // TODO:
  // type RTaggedList<T, A> = RObject<"tagged_list", T, A, T>;

  type Payload<TResult, TAttr = undefined> = RObject<string, TResult, TAttr>;

  export type SEXP<T extends Payload> = Payload<T> & {
    type: "sexp";
    value: T;
  };
  export type DoubleArray<A = undefined> = Payload<T, A> & {
    type: "double";
    value: number[];
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
    eval: <TResult>(command: string, k: RserveCallback<TResult>) => void;
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
