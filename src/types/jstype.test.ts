import { expect, test } from "vitest";
import XT from "./index";
import { ocapFuns } from "../../tests/r_files/oc";
import RserveClient, { Robj } from "../index";
import z from "zod";
import { promisify } from "../helpers";

global.WebSocket = require("ws");

test("JS functions passed", async () => {
  const longJob = XT.js_function([z.number(), z.string()], z.boolean());

  const fn = (x: number, y: string, k: (err: any, res: boolean) => void) => {
    k(null, true);
  };

  const fnx = longJob.parse(fn);

  fnx(5, "string", (err, res) => {
    if (err) console.error(err);
    else expect(res).toBe(true);
  });
});

test("JS functions in action - without return value", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  const funs = await R.ocap(ocapFuns);
  await funs.t3(async (i) => i + 10);
  const x = await funs.t4(2);
  expect(x).toBe(12);

  let progSoFar = 0;
  await funs.longjob((x, k) => {
    progSoFar = x;
    k(null, x); // <-- pass the data back to R
  });
  expect(progSoFar).equals(100);
});

// TODO: can we use callbackify to pass functions into ocaps?
