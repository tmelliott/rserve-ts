import Rserve from "rserve";

type CallbackFromPromise<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (args: A, k: (err: string, data: Awaited<R>) => void) => void
    : never;
};

const createRserve = (options: Rserve.RserveOptions) => {
  const client = Rserve.create(options);

  return {
    client,
    is_running: () => client.running,
    is_closed: () => client.closed,
    is_ocap_mode: () => client.ocap_mode,
    close: () => client.close(),
    login: (command: string) =>
      new Promise<void>((resolve, reject) => {
        client.login(command, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }),
    eval: <T>(command: string) =>
      new Promise<Rserve.Payload<T>>((resolve, reject) => {
        client.eval<T>(command, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }),
    createFile: (command: string) =>
      new Promise<void>((resolve, reject) => {
        client.createFile(command, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }),
    writeFile: (chunk: number[]) =>
      new Promise<void>((resolve, reject) => {
        client.writeFile(chunk, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }),
    closeFile: () =>
      new Promise<void>((resolve, reject) => {
        client.closeFile((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }),
    set: (key: string, value: string | Rserve.RserveValue) =>
      new Promise<void>((resolve, reject) => {
        client.set(key, value, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }),
    ocap: <const TFuns extends Record<string, (...args: any[]) => any>>() =>
      new Promise<TFuns>((resolve, reject) => {
        client.ocap<CallbackFromPromise<TFuns>>((err, data) => {
          if (err) {
            reject(err);
          } else {
            const ocapFuns = Object.fromEntries(
              Object.entries<any>(data).map(([key, fun]) => [
                key,
                (...args: any[]) =>
                  new Promise((resolve, reject) => {
                    fun(
                      args,
                      (
                        err: string,
                        data: CallbackFromPromise<TFuns>[keyof TFuns]
                      ) => {
                        if (err) {
                          reject(err);
                        } else {
                          resolve(data);
                        }
                      }
                    );
                  }),
              ])
            ) as TFuns;
            resolve(ocapFuns);
          }
        });
      }),
  };
};

const RserveClient = {
  create: createRserve,
};

export default RserveClient;
