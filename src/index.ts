import { RObject } from "./Robj";
import create from "./Rserve";

var s = create({
  host: "ws://localhost:8081",
  on_connect: test,
  //   debug: {
  //     message_in: (msg) => {
  //       console.log("message in", msg);
  //     },
  //     message_out: (buffer, command) => {
  //       console.log("message out", buffer, command);
  //     },
  //   },
});

// TODO: eval needs a run-time check that the callback is of the correct type,
// with a warning that either there has been an error or the type is wrong.

function range(x: number) {
  var result = new Float64Array(x);
  for (var i = 0; i < x; ++i) result[i] = i + 1; // R arrays are 1-based. wat
  return result;
}

async function test() {
  await s.set("a", 1);
  await s.eval<null>("cat(a)");
  await s.eval<Float32Array>("print(a)");
  await s.eval<Float64Array>("rnorm(100)");
  await s.set("y", [1, 2]);
  await s.set("x", new Float32Array([1, 2, 3, 4]));
  await s.set("z", "Hello, world!");
  await s.eval("z");
  await s.eval("print(c(z))");
  await s.eval("cat(z)");
  await s.eval("print(z)");
  await s.set("x", { a: 1, b: 2 });
  await s.eval("x");
  await s.set("x", true);
  let myx = await s.eval<RObject<boolean, boolean>>("x");
  console.log(myx);
  if (myx.value.json() !== true) throw new Error("Expected true, got " + myx);
  await s.set("a", 1);
  await s.set("a", new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer);
  await s.eval("print(a)");
  await s.eval('attr(Orange, "formula")');
  await s.eval("rnorm(3000000)");
  await s.set("a", new Float64Array(2500000));

  let mya = await s.eval<RObject<number, number>>("mean(a)");
  if (mya.value.json() !== 0) throw new Error("Expected 0, got " + mya);

  await s.set("a", range(2500000));
  let mya2 = await s.eval<RObject<number, number>>("a[1]");
  if (mya2.value.json() !== 1) throw new Error("Expected 1, got " + mya2);

  let mya100 = await s.eval<RObject<number, number>>("a[100]");
  if (mya100.value.json() !== 100)
    throw new Error("Expected 100, got " + mya100);

  let mya1000 = await s.eval<RObject<number, number>>("a[1000]");
  if (mya1000.value.json() !== 1000)
    throw new Error("Expected 1000, got " + mya1000);

  let mya2499999 = await s.eval<RObject<number, number>>("a[2499999]");
  if (mya2499999.value.json() !== 2499999)
    throw new Error("Expected 2499999, got " + mya2499999);

  const smry = await s.eval<RObject<number, number>>("summary(a)");
  console.log(smry.value.json());

  console.log("All run!");
  process.exit(0);
}
