import { test, expect } from "vitest";

import RserveClient from "./index";

test("Rserve connects and runs", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

  expect(R.is_running()).toBe(true);

  const x = await R.eval("1 + 1", R.numeric());
  expect(x).toBe(2);

  const irisNames = await R.eval("names(iris)", R.character());
  const expectedNames: string[] & {
    r_type: "string_array";
    r_attributes: any;
  } = [
    "Sepal.Length",
    "Sepal.Width",
    "Petal.Length",
    "Petal.Width",
    "Species",
  ] as any;
  expectedNames.r_type = "string_array";
  expect(irisNames).toEqual(expectedNames);

  const numWithAttr = await R.eval(
    "structure(1:3, class = 'myclass')",
    R.integer(3, {
      class: R.character(),
    })
  );
  const expectedNumWithAttr: number[] & {
    r_type: "int_array";
    r_attributes: {
      class: string;
    };
  } = new Int32Array([1, 2, 3]) as any;
  expectedNumWithAttr.r_type = "int_array";
  expectedNumWithAttr.r_attributes = {
    class: "myclass",
  };
  expect(numWithAttr).toEqual(expectedNumWithAttr);
  expect(numWithAttr.r_attributes.class).toBe("myclass");
});
