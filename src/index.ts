import { RObject } from "./Robj";
import create from "./Rserve";

var s = create({
  host: "ws://localhost:8081",
  //   on_connect: test,
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
function expect_equals(x: any) {
  return function (v: RObject<any>) {
    if (v.value.json() !== x)
      throw new Error(
        "Expected value to be " + String(x) + ", got " + String(v.value.json())
      );
  };
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
  myx.value.json();
  if (myx.value.json() !== true) throw new Error("Expected true, got " + myx);
  // await s.set("a", 1);
  // await s.set("a", new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer);
  // await s.eval("print(a)");
  // await s.eval('attr(Orange, "formula")');
  // await s.eval("rnorm(3000000)");
  // await s.set("a", new Float64Array(2500000));
  // // function () {
  // //   return s.eval("mean(a)").then(expect_equals(0));
  // // },
  // await s.set("a", range(2500000));

  // function () {
  //   return s.eval("a[1]").then(expect_equals(1));
  // },
  // function () {
  //   return s.eval("a[100]").then(expect_equals(100));
  // },
  // function () {
  //   return s.eval("a[1000]").then(expect_equals(1000));
  // },
  // function () {
  //   return s.eval("a[2499999]").then(expect_equals(2499999));
  // },
  console.log("All run!");
  process.exit(0);
}

// async function test() {
//   console.log(s);
//   const result = await s.eval<Float64Array>("1 + 1");
//   console.log(result);

//   console.log("\n\n\n=========================\n\n\n");
//   await s.set("x", 10);

//   console.log("\n\n\n=========================\n\n\n");
//   const result2 = await s.eval<Float64Array>("rnorm(x)");
//   console.log(result2);

//   // exit program

//   process.exit(0);

//   // s.eval<Float64Array>("1 + 1", (err, data) => {
//   //   if (err) {
//   //     console.log("Error: ", err);
//   //   } else {
//   //     console.log("===== Result: ", data, "\n", data.value.value[0]);
//   //   }

//   //   s.set("x", 10, (err) => {
//   //     console.log("Set: ", err ?? "success");

//   //     s.eval<Float64Array>("x + 5", (err, data) => {
//   //       if (err) {
//   //         console.log("Error: ", err);
//   //       } else {
//   //         console.log("Result: ", data.value.value[0]);
//   //       }
//   //     });
//   //   });
//   // });
// }

// setTimeout(() => {
//   console.log("timeout");
//   // s.close();
// }, 5000);
