import { RObject } from "./Robj";
import create from "./Rserve";

import { describe, expect, it } from "vitest";

// only run if websocket server is running
let RSERVE_RUNNING = process.env.RSERVE_RUNNING === "true";

describe("Rserve connects and runs", () => {
  function range(x: number) {
    var result = new Float64Array(x);
    for (var i = 0; i < x; ++i) result[i] = i + 1; // R arrays are 1-based. wat
    return result;
  }

  it.runIf(RSERVE_RUNNING)(
    "Connects and runs tests",
    async () => {
      async function test() {
        // if (!s.running) {
        //   console.log("Rserve not running");
        //   throw new Error("Rserve not running");
        // }
        console.log("STARTING TEST");
        await s.set("a", 1);
        await s.eval<null>("cat(a)");
        await s.eval<Float32Array>("print(a)");
        await s.eval<Float64Array>("rnorm(100)");
        await s.set("y", [1, 2]);
        await s.set("x", new Float32Array([1, 2, 3, 4]));
        await s.set("z", "Hello, world!");
        await s.eval("z");
        await s.eval("print(c(z))");
        await s.eval("cat(z)");
        await s.eval("print(z)");
        await s.set("x", { a: 1, b: 2 });
        await s.eval("x");
        await s.set("x", true);
        let myx = await s.eval<RObject<boolean, boolean>>("x");
        console.log(myx);
        expect(myx.value.json()).toBe(true);

        await s.set("a", 1);
        await s.set("a", new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer);
        await s.eval("print(a)");
        await s.eval('attr(Orange, "formula")');
        await s.eval("rnorm(3000000)");
        await s.set("a", new Float64Array(2500000));

        let mya = await s.eval<RObject<number, number>>("mean(a)");
        expect(mya.value.json()).toBe(0);

        await s.set("a", range(2500000));
        let mya2 = await s.eval<RObject<number, number>>("a[1]");
        expect(mya2.value.json()).toBe(1);

        let mya100 = await s.eval<RObject<number, number>>("a[100]");
        expect(mya100.value.json()).toBe(100);

        let mya1000 = await s.eval<RObject<number, number>>("a[1000]");
        expect(mya1000.value.json()).toBe(1000);

        let mya2499999 = await s.eval<RObject<number, number>>("a[2499999]");
        expect(mya2499999.value.json()).toBe(2499999);

        //   const smry = await s.eval<RObject<number, number>>("summary(a)");
        //   console.log(smry.value.json());

        console.log("All run!");
        process.exit(0);
      }

      var s = await create({
        host: "ws://localhost:8081",
        // on_connect: test,
        //   debug: {
        //     message_in: (msg) => {
        //       console.log("message in", msg);
        //     },
        //     message_out: (buffer, command) => {
        //       console.log("message out", buffer, command);
        //     },
        //   },
      });
      test();
    },
    { timeout: 10000 }
  );
});

// TODO: eval needs a run-time check that the callback is of the correct type,
// with a warning that either there has been an error or the type is wrong.
