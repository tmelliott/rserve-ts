import { expect, test } from "vitest";
import XT from ".";
import { ocapFuns } from "../../tests/r_files/oc";
import RserveClient from "..";
import z from "zod";
import { callbackify } from "util";

test("JS functions passed", async () => {
  const longJob = XT.js_function([z.number(), z.string()], z.boolean());

  const fn = async (x: number, y: string) => {
    console.log("boing ", x, " - ", y);
    return true;
  };

  const fnx = longJob.parse(fn);

  // fnx(5, "string", (err, res) => {
  //   if (err) console.error(err);
  //   else expect(res).toBe(true);
  // });

  // // use in object
  // const obj = z.object({
  //   fun: XT.js_function([z.number(), z.string()]),
  // });
});

test("JS functions in action", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  const funs = await R.ocap(ocapFuns);

  const prog = (i: number) => {
    console.log("Progress: ", i);
    return true;
  };

  funs.t3;

  void funs.t3(async (i) => i + 10);
  const x = await funs.t4(2);
  console.log(x);

  // void funs.longjob((err: any, ));
});
