const R = require("../src/Rserve.js");
Promise = require("bluebird");

let s;

const connected = () => {
  console.log("Connected");
  s.ocap(async (err, funs) => {
    if (funs) {
      const add = funs.add;
      console.log(add);

      console.log("Calling add(1, 2)");
      add(1, 2, (err, data) => {
        console.log(data);
      });

      console.group("Standard Rserve tests");

      funs = Promise.promisifyAll(funs);

      // standard Rserve tests:
      let x;
      try {
        x = await funs.tfailAsync(null);
      } catch (e) {
        console.log("Nice!");
      }
      if (x !== undefined) throw new Error("test failed.");

      x = await funs.t1Async(5);
      console.log("T1:", x.data);

      x = await funs.t2Async(4);
      console.log("T2:", x.data);

      // k sends the result back to the client
      x = await funs.t3Async(function (x, k) {
        k(null, 21 + x);
      });
      console.log("T3:", x.data);

      x = await funs.t4Async(5);
      console.log("T4:", x.data);
      if (x.data !== 26) throw new Error("test failed.");

      x = await funs.t5Async(function (i) {
        return i * i;
      });
      console.log("T5:", x);

      x = await funs.t6Async(5);
      const {
        data: [{ data: f }, { data: i }],
      } = x;
      console.log("T6:", f(i));
      if (f(i) !== 25) throw new Error("test failed.");

      console.groupEnd();
      process.exit(0);
    }
  });
};

s = R.create({
  host: "http://127.0.0.1:8781",
  on_connect: connected,
});
