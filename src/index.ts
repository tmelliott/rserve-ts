import { z } from "zod";
import Rserve from "./Rserve";

import Robj from "./types";

export type CallbackFromPromise<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (args: A, k: (err: string, data: Awaited<R>) => void) => void
    : never;
};

type SEXP<T extends z.ZodTypeAny = z.ZodTypeAny> = ReturnType<
  typeof Robj.sexp<T>
>;

const createRserve = async (
  options: Omit<Rserve.RserveOptions, "on_connect" | "on_error">
) => {
  const client = await new Promise<Rserve.RserveClient>((resolve, reject) => {
    const s = Rserve.create({
      ...options,
      on_connect: () => resolve(s),
      on_error: (err) => reject(err),
    });
  });

  async function evalX<T extends z.ZodTypeAny>(
    command: string,
    schema: T
  ): Promise<z.infer<T>>;
  async function evalX(command: string): Promise<unknown>;
  async function evalX<T extends z.ZodTypeAny>(command: string, schema?: T) {
    return new Promise((resolve, reject) => {
      client.eval<z.infer<SEXP<T>>>(command, (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            if (schema) {
              resolve(schema.parse(data.value.json()));
            } else {
              const x = (data as any).value.json();
              resolve(x);
            }
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
    ocap: <TFuns extends z.ZodRawShape>(schema?: TFuns) =>
      new Promise<z.infer<z.ZodObject<TFuns, "strip">>>((resolve, reject) => {
        client.ocap((err: string, data: Record<string, Function>) => {
          if (err) {
            reject(err);
          } else {
            const ocapFuns = data;
            if (schema) {
              const res = z.object(schema).safeParse(ocapFuns);
              if (res.success) resolve(res.data);
              else {
                console.error(res.error);
                console.log(res.data);
                reject(res.error);
              }
            } else resolve(ocapFuns as any);
          }
        });
      }),
    Robj,
  };
};

const RserveClient = {
  create: createRserve,
};

export default RserveClient;
// export { Robj };
export * as Rfmt from "./helpers";
export type * from "./types";
