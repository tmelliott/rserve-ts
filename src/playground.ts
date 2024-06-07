import { RClos } from "./Rserve";
import RserveClient from "./index";
const R = RserveClient.create({
  host: "http://127.0.0.1:8081",
  on_connect: () => run_tests(),
});

// type V = RVector<
//   number,
//   [
//     {
//       value: {
//         name: "names";
//         value: {
//           type: "string";
//           value: ["one", "two", "three"];
//         };
//       };
//     }
//   ]
// >;

type KnownCharacter<T extends string[]> = {
  type: "character_array";
  value: T;
  attributes: undefined;
};
let levels: KnownCharacter<["one", "two"]>;
// levels.value

type Factor<T extends string[] = string[]> = T;
type X1 = Factor<["one", "two", "three"]>;
type X2 = Factor;

const run_tests = async () => {
  console.log("Connected to R");
  console.log(R.is_running());

  console.log("Connected to R");
  const x = await R.eval<any>("function(x) c(1, 2)");
  // const x = await R.eval<any>("list(a = 1, b = 2, c = 3)");
  // const x = await R.eval<any>("iris$Species[1:3]");
  console.log(x);
  // console.log(x.value.attributes.value);
  // console.log(x.value.json());

  // const x = await R.eval<RClos<any, any>>("function(a, b) { 'hello world' }");
  // console.log(x);
  // console.log(x.value.value);
  // console.log(x.value.value.formals.value);

  process.exit(0);

  // const x = await R.eval<number>("1 + 1");

  // const oc = await R.ocap<{
  //   add: (a: number, b: number) => Promise<number>;
  // }>();
  // const z = await oc.add(1, 2);
  // console.log(z);
};
