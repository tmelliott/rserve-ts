import RserveClient from "./index";

// set global WebSocket
global.WebSocket = require("ws");

import { test, expect } from "vitest";

import { ocapFuns } from "../tests/r_files/oc";
import { objectWithAttributes, typeWithAttributes } from "./types/helpers";
import { z } from "zod";

test("Rserve connects and runs", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });
  const Robj = R.Robj;

  expect(R.is_running()).toBe(true);

  const x = await R.eval("1 + 1", Robj.double(1));
  expect(x).toBe(2);

  const irisNames = await R.eval("names(iris)", Robj.string(0));
  const expectedNames = objectWithAttributes(
    ["Sepal.Length", "Sepal.Width", "Petal.Length", "Petal.Width", "Species"],
    "string_array"
  );
  expect(irisNames).toEqual(expectedNames);

  const numWithAttr = await R.eval(
    "structure(1:3, class = 'myclass')",
    Robj.integer({
      class: Robj.string(),
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

// test("Rserve connects to OCAP server", async () => {
//   const R = await RserveClient.create({
//     host: "http://127.0.0.1:8781",
//   });

//   const funs = await R.ocap(ocapFuns);

//   let x0 = true;
//   try {
//     await funs.tfail(1);
//   } catch (err) {
//     x0 = false;
//     console.error("Nice.");
//   }
//   expect(x0).toBe(false);

//   const { data: x1 } = await funs.t1(5);
//   expect(x1).toBe(8);

//   const { data: x2 } = await funs.t2(4);
//   expect(x2).toBe(4);

//   const { data: x3 } = await funs.t3(async (x) => 21 + x);
//   expect(x3).toBe(true);

//   const { data: x4 } = await funs.t4(5);
//   expect(x4).toBe(26);

//   const x5 = await funs.t5(function (i) {
//     return i * i;
//   });
//   expect(x5).toBe(null);

//   const {
//     data: [{ data: f6 }, { data: i6 }],
//   } = await funs.t6(5);
//   const x6 = f6(i6);
//   expect(x6).toBe(25);
// });
