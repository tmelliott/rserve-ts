import RserveClient from "./index";
const R = RserveClient.create({
  host: "http://127.0.0.1:8081",
  on_connect: () => run_tests(),
});

const run_tests = async () => {
  console.log("Connected to R");
  console.log(R.is_running());

  R.client.eval("1 + 1", (err, data) => {
    console.log(data);
  });

  // const x = await R.eval<number>("1 + 1");

  // const oc = await R.ocap<{
  //   add: (a: number, b: number) => Promise<number>;
  // }>();
  // const z = await oc.add(1, 2);
  // console.log(z);
};
