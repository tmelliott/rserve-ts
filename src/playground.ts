import RserveClient from "./index";
import { ocapFuns } from "../tests/r_files/oc";
import * as RT from "./types";

// set global WebSocket
global.WebSocket = require("ws");

const noOcap = async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  console.log("Connected to R");
  console.log(R.is_running());

  console.log("\n\n----");
  const logi = await R.eval("TRUE", R.logical(1));
  console.log("Logi ...");
  console.log(logi);

  const int = await R.eval("1L", R.integer(1));
  console.log("Int ...");
  console.log(int);

  const range = await R.eval("range(1:5)", R.integer(2));
  console.log("Range ...");
  console.log(range);

  const mean = await R.eval("mean(1:5)", R.numeric(1));
  console.log("Mean ...");
  console.log(mean);

  const xrand = await R.eval("rnorm(5)", R.numeric(5));
  console.log("Random ...");
  console.log(xrand);

  const names = await R.eval("names(iris)", R.character());
  console.log("Names ...");
  console.log(names);

  const species = await R.eval(
    "unique(iris$Species)",
    R.factor(["setosa", "versicolor", "virginica"])
  );
  console.log("Species ...");
  console.log(species);

  const tbl = RT.asTable([1, 2, 3, 4, 5, 6], [3, 2]);
  console.log(tbl);
  console.log(tbl[1][0]);

  const {
    data: tbl1,
    r_attributes: {
      dim: { data: tbldim },
    },
  } = await R.eval("table(iris$Species)", R.table([3]));
  console.log("Table 1 ...");
  console.log(RT.asTable(tbl1, [tbldim]));

  const tbl2 = await R.eval(
    "with(iNZight::census.at.school.500, table(travel, gender))",
    RT.table([6, 2])
  );
  console.log("Table 2 ...");
  console.log(RT.asTable(tbl2.data, [6, 2]));
  if (tbl2.r_attributes) {
    console.log(tbl2.r_attributes.dimnames);
  }

  //   R.integer(3, {
  //     dimnames: z.object({
  //       "": R.character(),
  //     }),
  //   })
  // );
  // console.log("Table ...");
  // console.log(tbl);
  // console.log((tbl as any).json());
  // console.log((tbl as any).json().r_attributes);

  // the json method returns the type of value with attributes

  // const tbl2 = await R.eval(
  //   "table(iris$Species)",
  //   integer({
  //     dimnames: list({
  //       "": character(["setosa", "versicolor", "virginica"]),
  //     }),
  //   })
  // );
  // console.log("Table 2...");
  // console.log(tbl2);
  // console.log(tbl2.json());
  // const tblx = tbl2.json();

  // const iris2 = await R.eval("iris");
  // // @ts-ignore
  // console.log(iris2.value.json());

  // const iris = await R.eval(
  //   "iris",
  //   rtypes.dataframe({
  //     "Sepal.Length": rtypes.numeric(),
  //     "Sepal.Width": rtypes.numeric(),
  //     "Petal.Length": rtypes.numeric(),
  //     "Petal.Width": rtypes.numeric(),
  //     Species: rtypes.factor(["setosa", "versicolor", "virginica"]),
  //   })
  // );

  // const mu = await R.value(z.number()).eval("mean(1:5)");
  // const numeric = z.number();
  // const mu = await R.eval(
  //   "mean(1:5)",
  //   z.object({
  //     type: z.literal("sexp"),
  //     value: z.object({
  //       type: z.literal("double_array"),
  //       value: z.instanceof(Float64Array),
  //       attributes: z.undefined(),
  //       json: z.function().returns(z.number()),
  //     }),
  //   })
  // );

  // const x = await R.eval<any>("mean(1:5)");
  // const x = await R.eval<any>("iris$Species[1:3]");
  // console.log(x);
  // console.log(x.value.attributes.value);
  // console.log(x.value.json());

  // const x = await R.eval<RClos<any, any>>("function(a, b) { 'hello world' }");
  // console.log(x);
  // console.log(x.value.value);
  // console.log(x.value.value.formals.value);

  // const x = await R.eval<number>("1 + 1");

  // const oc = await R.ocap<{
  //   add: (a: number, b: number) => Promise<number>;
  // }>();
  // const z = await oc.add(1, 2);
  // console.log(z);
};

const ocapTest = async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  const oc = await R.ocap();

  const app = await R.ocap(ocapFuns);

  const { data: x1 } = await app.t1(5);
  console.log("T1:", x1);

  const { data: x2 } = await app.t2(4);
  console.log("T2:", x2);

  // this API is tricky - can we improve it? e.g.,
  // app.t3(function(x) {
  //   return 21 + x;
  // })
  const { data: x3 } = await app.t3(function (x, k) {
    k(null, 21 + x);
  });
  console.log("T3:", x3);

  // T4: 26
  const { data: x4 } = await app.t4(5);
  console.log("T4:", x4);

  // T5: null
  const x5 = await app.t5(function (i) {
    return i * i;
  });
  console.log("T5:", x5);

  // T6: 25
  const {
    data: [{ data: f6 }, { data: i6 }],
  } = await app.t6(5);
  const x6 = f6(i6);
  console.log("T6:", x6);
};

(async () => {
  await noOcap();
  // await ocapTest();
  process.exit(0);
})();
