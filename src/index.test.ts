import { test, assertType, expect } from "vitest";

import RserveClient from "./index";

test("Rserve connects and runs", async () => {
  const R = RserveClient.create({
    host: "http://127.0.0.1:8081",
    on_connect: () => run_tests(),
  });

  const run_tests = async () => {
    // console.log("Connected to R");
    console.log(R);
    const x = await R.eval<number>("1 + 1");
    assertType<{ type: string; value: number }>(x);
    expect(x).toBe(3);

    // const oc = await R.ocap<{
    //   add: (a: number, b: number) => Promise<number>;
    // }>();
    // const z = await oc.add(1, 2);
    // console.log(z);
  };
});
