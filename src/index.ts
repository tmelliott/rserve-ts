import { z } from "zod";
import Rserve from "./Rserve";
import {
  logical,
  character,
  factor,
  integer,
  numeric,
  sexp,
  table,
  list,
  dataframe,
} from "./types";

export type CallbackFromPromise<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (args: A, k: (err: string, data: Awaited<R>) => void) => void
    : never;
};

type SEXP<
  // T extends z.ZodTypeAny = z.ZodTypeAny,
  // A extends z.ZodTypeAny = z.ZodTypeAny,
  T extends z.ZodTypeAny = z.ZodTypeAny
> = ReturnType<typeof sexp<T>>;

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

  // const parseAttr = (attr: Record<string, any>) => {
  //   if (!attr) return;
  //   const attrs = Object.entries(attr).map(([key, value]) => {
  //     if (value.data) {
  //       const r: any = value.data;
  //       r.r_type = value.r_type;
  //       r.r_attributes = parseAttr(value.r_attributes);
  //       value = r;
  //     }
  //     return [key, value];
  //   });
  //   return Object.fromEntries(attrs);
  // };

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
              // if (typeof x === "object" && x.data) {
              //   const r: any = x.data;
              //   r.r_type = x.r_type;
              //   r.r_attributes = parseAttr(x.r_attributes);
              //   resolve(r);
              // }
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
        client.ocap((err: string, data: { data: Record<string, Function> }) => {
          if (err) {
            reject(err);
          } else {
            const ocapFuns = data.data;
            if (schema) resolve(z.object(schema).parse(ocapFuns));
            else resolve(ocapFuns as any);
          }
        });
      }),
    logical,
    integer,
    numeric,
    character,
    factor,
    table,
    list,
    dataframe,
  };
};

const RserveClient = {
  create: createRserve,
};

export default RserveClient;
export * as Robj from "./types";
export * as Rfmt from "./helpers";
export type * from "./types";
