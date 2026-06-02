import RserveClient, { Robj } from "./index";

// set global WebSocket
global.WebSocket = require("ws");

import { test, expect } from "vitest";

import { ocapFuns } from "../tests/r_files/oc";
import { objectWithAttributes } from "../src/types/helpers";

test("Rserve connects and runs", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  expect(R.is_running()).toBe(true);

  const x = await R.eval("1 + 1", Robj.numeric(1));
  expect(x).toBe(2);

  const irisNames = await R.eval("names(iris)", Robj.character(0));
  const expectedNames = objectWithAttributes(
    ["Sepal.Length", "Sepal.Width", "Petal.Length", "Petal.Width", "Species"],
    "string_array"
  );
  expect(irisNames).toEqual(expectedNames);

  const numWithAttr = await R.eval(
    "structure(1:3, class = 'myclass')",
    Robj.integer({
      class: Robj.character(1),
    })
  );
  const expectedNumWithAttr = objectWithAttributes(
    new Int32Array([1, 2, 3]),
    "int_array",
    {
      class: "myclass",
    }
  );
  expect(numWithAttr).toEqual(expectedNumWithAttr);
  expect(numWithAttr.r_attributes.class).toBe("myclass");
});

test("Rserve connects to OCAP server", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  const funs = await R.ocap(ocapFuns);

  let x0 = true;
  try {
    await funs.tfail(1);
  } catch (err) {
    x0 = false;
  }
  expect(x0).toBe(false);

  const x1 = await funs.t1(5);
  expect(x1).toBe(8);

  const x2 = await funs.t2(4);
  expect(x2).toBe(4);

  const x3 = await funs.t3(async (x) => 21 + x);
  expect(x3).toBe(true);

  const x4 = await funs.t4(5);
  expect(x4).toBe(26);

  const x5 = await funs.t5(function (i) {
    return i * i;
  });
  expect(x5).toBe(null);

  const [f6, i6] = await funs.t6(5);
  const x6 = f6(i6);
  expect(x6).toBe(25);
});

test("length-1 R vectors are coerced to arrays for array-typed schemas", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  // character(0L) — plain string from Rserve becomes string[]
  const char1 = await R.eval("c('only-one')", Robj.character(0));
  expect(char1).toEqual(objectWithAttributes(["only-one"], "string_array"));

  // integer(0L) — plain number from Rserve becomes Int32Array
  const int1 = await R.eval("1L", Robj.integer(0));
  expect(int1).toEqual(objectWithAttributes(new Int32Array([1]), "int_array"));

  // numeric(0L) — plain number from Rserve becomes Float64Array
  const num1 = await R.eval("1.5", Robj.numeric(0));
  expect(num1).toEqual(
    objectWithAttributes(new Float64Array([1.5]), "double_array")
  );

  // logical(0L) — plain boolean from Rserve becomes boolean[]
  const bool1 = await R.eval("TRUE", Robj.logical(0));
  expect(bool1).toEqual(objectWithAttributes([true], "bool_array"));
});

test("OCAP record return strips r_type and r_attributes", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  const funs = await R.ocap(ocapFuns);

  // car_lm returns { coef, rsq } where coef() returns Record<string, number>
  const model = await funs.car_lm("mpg", "wt");
  const coefs = await model.coef();

  // The record should be a plain object with intercept and slope
  expect(coefs).toHaveProperty("(Intercept)");
  expect(coefs).toHaveProperty("wt");
  expect(typeof coefs["(Intercept)"]).toBe("number");
  expect(typeof coefs["wt"]).toBe("number");

  // r_type and r_attributes must NOT be present — this is the bug
  expect(coefs).not.toHaveProperty("r_type");
  expect(coefs).not.toHaveProperty("r_attributes");

  // Object.keys should only contain coefficient names
  expect(Object.keys(coefs).sort()).toEqual(["(Intercept)", "wt"].sort());
});
