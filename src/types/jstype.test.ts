import { expect, test } from "vitest";
import { z } from "zod";
import _recursive_list from "./recursive";
import XT from ".";

test("JS functions passed", async () => {
  const longJob = XT.js_function(z.number());

  const fn = (x: number) => {
    console.log("boing");
  };

  const fnx = longJob.parse(fn);
  expect(fnx([5], () => {})).toBe(undefined);
});
