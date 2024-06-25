import { z } from "zod";
import Rserve from "./Rserve";
import { integer, numeric, sexp } from "./types";

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

  async function evalX<T extends SEXP>(
    command: string,
    schema: T
  ): Promise<ReturnType<z.infer<T>["value"]["json"]>>;
  async function evalX(command: string): Promise<unknown>;
  async function evalX(command: string, schema?: SEXP) {
    return new Promise((resolve, reject) => {
      client.eval(command, (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            if (schema) resolve(schema.parse(data).value.json());
            else resolve((data as any).value.json());
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
    integer: integer,
    numeric: numeric,
  };
};

const RserveClient = {
  create: createRserve,
};

export default RserveClient;
