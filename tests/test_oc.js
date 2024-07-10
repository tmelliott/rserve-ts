const R = require("../src/Rserve.js");

let s;

const connected = () => {
  console.log("Connected");
  s.ocap((err, data) => {
    if (data) {
      const add = data.add;
      console.log(add);

      console.log("Calling add(1, 2)");
      add(1, 2, (err, data) => {
        console.log(data);
      });
    }
  });
};

s = R.create({
  host: "http://127.0.0.1:8781",
  on_connect: connected,
});
