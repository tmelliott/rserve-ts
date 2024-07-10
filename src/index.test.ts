import { test, expect } from "vitest";

import RserveClient from "./index";

test("Rserve connects and runs", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  expect(R.is_running()).toBe(true);

  const { data: x } = await R.eval("1 + 1", R.numeric());
  expect(x).toBe(2);

  const irisNames = await R.eval("names(iris)", R.character());
  const expectedNames = {
    data: [
      "Sepal.Length",
      "Sepal.Width",
      "Petal.Length",
      "Petal.Width",
      "Species",
    ],
    r_type: "string_array",
  };
  expect(irisNames).toEqual(expectedNames);

  const numWithAttr = await R.eval(
    "structure(1:3, class = 'myclass')",
    R.integer(3, {
      class: R.character(),
    })
  );
  const expectedNumWithAttr = {
    data: new Int32Array([1, 2, 3]),
    r_type: "int_array",
    r_attributes: {
      class: {
        data: "myclass",
        r_type: "string_array",
      },
    },
  };
  expect(numWithAttr).toEqual(expectedNumWithAttr);
  expect(numWithAttr.r_attributes.class.data).toBe("myclass");
});

test("Rserve connects to OCAP server", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  // const { data: funs } = await R.ocap();
  // console.log(funs);
});
