import { test, assertType, expect } from "vitest";

import RserveClient from "./index";
import { DoubleArray } from "./Rserve";

test("Rserve connects and runs", async () => {
  const R = RserveClient.create({
    host: "http://127.0.0.1:8081",
    on_connect: () => run_tests(),
  });

  const run_tests = async () => {
    console.log("Connected to R");
    expect(R.is_running()).toBe(true);
    const x = await R.eval<DoubleArray>("1 + 1");
    assertType<{
      type: "sexp";
      value: {
        type: "double";
        value: number[];
      };
    }>(x);
    console.log(x);
    expect(x.value.value).toBe(2);

    // const oc = await R.ocap<{
    //   add: (a: number, b: number) => Promise<number>;
    // }>();
    // const z = await oc.add(1, 2);
    // console.log(z);
  };
});
