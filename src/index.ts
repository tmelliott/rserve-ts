import { z } from "zod";
import Rserve from "./Rserve";
import { numeric, sexp } from "./types";

type CallbackFromPromise<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (args: A, k: (err: string, data: Awaited<R>) => void) => void
    : never;
};

type SEXP<
  T extends z.ZodTypeAny = z.ZodTypeAny,
  A extends z.ZodTypeAny = z.ZodTypeAny,
  J extends z.ZodTypeAny = z.ZodTypeAny
> = ReturnType<typeof sexp<string, T, A, J>>;

// type WithTypes<T> = T & { r_type: string };

// const withJson = <
//   T extends z.ZodTypeAny,
//   A extends z.ZodTypeAny,
//   J extends z.ZodTypeAny
// >(
//   obj: ReturnType<SEXP<T, A, J>["parse"]>["value"]
// ) => {
//   const new_obj: WithTypes<typeof obj.value> = obj.value as WithTypes<
//     typeof obj.value
//   >;
//   new_obj.r_type = obj.type;
//   return new_obj;
// };

const createRserve = (options: Rserve.RserveOptions) => {
  const client = Rserve.create(options);

  async function evalX<T extends SEXP>(
    command: string,
    schema: T
  ): Promise<z.infer<T>["value"]>;
  async function evalX(command: string): Promise<unknown>;
  async function evalX(command: string, schema?: SEXP) {
    return new Promise((resolve, reject) => {
      client.eval(command, (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            if (schema) resolve(schema.parse(data).value);
            else resolve((data as any).value);
          } catch (err) {
            reject(err);
          }
        }
      });
    });
  }

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
    eval: evalX,
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
    // value: <TResult extends z.ZodTypeAny>(schema: TResult) => ({
    //   eval: (command: string) =>
    //     new Promise<z.infer<TResult>>((resolve, reject) => {
    //       client.eval(command, (err, data) => {
    // if (err) {
    //   reject(err);
    // } else {
    //   try {
    //     resolve(schema.parse(data.value) as z.infer<TResult>);
    //   } catch (err) {
    //     reject(err);
    //   }
    // }
    //       });
    //     }),
    // }),
  };
};

const RserveClient = {
  create: createRserve,
};

export default RserveClient;
