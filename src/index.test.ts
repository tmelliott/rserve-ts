import { test, expect } from "vitest";

import RserveClient from "./index";

test("Rserve connects and runs", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

  console.log("Connected to R");
  expect(R.is_running()).toBe(true);
  const x = await R.eval("1 + 1", R.numeric());
  expect(x).toBe(2);
});
