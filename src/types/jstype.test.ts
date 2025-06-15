import { expect, test } from "vitest";
import XT from ".";
import { ocapFuns } from "../../tests/r_files/oc";
import RserveClient from "..";
import z from "zod";

global.WebSocket = require("ws");

test("JS functions passed", async () => {
  const longJob = XT.js_function([z.number(), z.string()], z.boolean());

  const fn = async (x: number, y: string) => {
    return true;
  };

  const fnx = longJob.parse(fn);

  fnx(5, "string", (err, res) => {
    if (err) console.error(err);
    else expect(res).toBe(true);
  });
});

test("JS functions in action", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  const funs = await R.ocap(ocapFuns);
  await funs.t3(async (i) => i + 10);
  const x = await funs.t4(2);
  expect(x).toBe(12);

  let progSoFar = 0;
  await funs.longjob((x: number, k: (err: any, res: void) => void) => {
    progSoFar = x;
    k(null, undefined);
  });
  expect(progSoFar).equals(100);
});

// TODO: can we use callbackify to pass functions into ocaps?
