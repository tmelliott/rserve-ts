import RserveClient from "./index";
import { ocapFuns } from "../tests/r_files/oc";
import * as RT from "./types";
import { z } from "zod";

// import { Presets, SingleBar } from "cli-progress";
// import { callbackify, promisify } from "util";
// import { as_vector } from "./helpers";
// import { boolean, integer } from "./robject";

// set global WebSocket
global.WebSocket = require("ws");

// const arrayWithProps = <T, R extends string>(r_type: R, o_type: string) =>
//   z.custom<T[] & { r_type: R; r_attributes?: any }>((data) => {
//     if (
//       typeof data === "object" &&
//       data.hasOwnProperty("r_type") &&
//       data.r_type === r_type &&
//       Array.isArray(data)
//     )
//       return data.length === 0 || typeof data[0] == o_type;

//     return false;
//   });

// const booleanArrayWithProps = arrayWithProps<boolean, "bool_array">(
//   "bool_array",
//   "boolean"
// );

// const booleanArrayWithProps = z.custom<boolean[] & { r_type: "bool_array" }>(
//   (data) => {
//     if (
//       typeof data === "object" &&
//       data.hasOwnProperty("r_type") &&
//       data.r_type === "bool_array" &&
//       Array.isArray(data)
//     )
//       return data.length === 0 || typeof data[0] == "boolean";

//     return false;
//   }
// );

// type BooleanArrayWithProps = z.infer<typeof booleanArrayWithProps>;

// const stringArrayWithProps = z.custom<string[] & { r_type: "string_array" }>(
//   (data) => {
//     if (
//       typeof data === "object" &&
//       data.hasOwnProperty("r_type") &&
//       data.r_type === "string_array" &&
//       Array.isArray(data)
//     ) {
//       return data.length === 0 || typeof data[0] == "string";
//     }
//     return false;
//   }
// );

import XT from "./types/xt_types";
import { Presets, SingleBar } from "cli-progress";

const noOcap = async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  console.log("Connected to R");
  console.log(R.is_running());

  console.log("\n\n---- Null ----");
  console.log(await R.eval("NULL", XT.null()));

  console.log("\n\n---- Boolean ----");
  console.log(await R.eval("TRUE", XT.boolean(1)));
  console.log(await R.eval("c(TRUE, FALSE, TRUE)", XT.boolean(3)));
  console.log(await R.eval("logical()", XT.boolean(0)));
  console.log(
    await R.eval(
      "structure(TRUE, some = 'thing')",
      XT.boolean({ some: z.literal("thing") })
    )
  );

  console.log("\n\n---- Double ----");
  console.log(await R.eval("1.0", XT.double(1)));
  console.log(await R.eval("c(1, 2, 3)", XT.double(3)));
  console.log(await R.eval("numeric()", XT.double(0)));
  console.log(
    await R.eval(
      "structure(1.0, some = 'thing')",
      XT.double({ some: z.literal("thing") })
    )
  );

  console.log("\n\n---- Integer ----");
  console.log(await R.eval("1L", XT.integer(1)));
  console.log(await R.eval("1:5", XT.integer(5)));
  console.log(await R.eval("integer()", XT.integer(0)));
  const i4 = await R.eval(
    "structure(1L, some = 'thing')",
    XT.integer({
      some: R.Robj.string(1),
    })
  );
  console.log(i4);

  console.log("\n\n---- List ----");
  console.log(
    await R.eval(
      "list(1, 2, 'hello')",
      // this should not be allowed (should have to be XT types)
      XT.vector([z.number(), z.number(), z.string()])
    )
  );
  console.log(
    await R.eval(
      "list(1, 1:10, 'hello')",
      XT.vector([XT.double(1), XT.integer(10), XT.string(1)])
    )
  );
  const v3 = await R.eval(
    "list(a = 1, b = 2, c = 3)",
    XT.vector({
      a: XT.double(1),
      b: XT.double(1),
      c: XT.double(1),
    })
  );
  console.log(v3.r_attributes.names);

  const v4 = await R.eval(
    "list(a = 1:5, b = 1:5)",
    XT.vector(z.record(z.string(), XT.integer(5)))
  );
  console.log(v4);

  console.log("\n\n---- Tagged List ----");
  console.log(await R.eval("formals(lm)", XT.tagged_list()));
  console.log(await R.eval("pairlist(a = 1, b = 2)", XT.tagged_list()));

  console.log("\n\n---- Lang ----");
  console.log(await R.eval("quote(1 + 2)", XT.lang()));
  console.log(
    await R.eval("quote(a + (b * 2) + ifelse(TRUE, 1, 2))", XT.lang())
  );
  console.log(await R.eval("quote(colnames(iris))", XT.lang()));

  console.log("\n\n---- Symbol ----");
  console.log(await R.eval("as.symbol('x')", XT.symbol()));

  console.log("\n\n---- Factor ----");
  console.log(
    await R.eval(
      "iris$Species[1:5]",
      XT.factor(["setosa", "versicolor", "virginica"])
    )
  );
  console.log(
    await R.eval(
      "iris$Species[1]",
      XT.factor(["setosa", "versicolor", "virginica"])
    )
  );

  console.log(await R.eval("factor(1:5)", XT.factor()));
  console.log(
    await R.eval(
      "structure(factor(sample(LETTERS, 5)), some = 'thing')",
      XT.factor({ some: XT.string(1) })
    )
  );

  // console.log(await R.eval("iris$Species[1:5]"));
  // console.log(((await R.eval("iris[1:5,]")) as any).Species);

  // const y = z
  //   .array(z.boolean())
  //   .and(z.object({ r_type: z.literal("bool_array") }));
  // type Y = z.infer<typeof y>;

  // const xx = boolean(2);
  // type Xx = z.infer<typeof xx>;
  // const x2 = xx.and(z.object({ r_attributes: z.object({ some: z.string() }) }));
  // type X2 = z.infer<typeof x2>;

  // const bx = boolean({
  //   some: R.character(1),
  // });
  // type Bx = z.infer<typeof bx>;

  // console.log("\n\n---- Integer ----");
  // console.log(await R.eval("1L", integer(1)));
  // console.log(await R.eval("1:5", z.any()));
  // console.log(await R.eval("structure(TRUE, some = 'thing')", z.any()));

  // const range = await R.eval("range(1:5)", R.integer(2));
  // console.log("Range ...");
  // console.log(range);

  // const mean = await R.eval("mean(1:5)", R.numeric(1));
  // console.log("Mean ...");
  // console.log(mean);

  // const xrand = await R.eval("rnorm(5)", R.numeric(5));
  // console.log("Random ...");
  // console.log(xrand);

  // const names = await R.eval("names(iris)", R.character());
  // console.log("Names ...");
  // console.log(names);

  // const species = await R.eval(
  //   "unique(iris$Species)",
  //   R.factor(["setosa", "versicolor", "virginica"])
  // );
  // console.log("Species ...");
  // console.log(species);

  // const tbl = RT.asTable([1, 2, 3, 4, 5, 6], [3, 2]);
  // console.log(tbl);
  // console.log(tbl[1][0]);

  // const {
  //   data: tbl1,
  //   r_attributes: {
  //     dim: { data: tbldim },
  //   },
  // } = await R.eval("table(iris$Species)", R.table([3]));
  // console.log("Table 1 ...");
  // console.log(RT.asTable(tbl1, [tbldim]));

  // const tbl2 = await R.eval(
  //   "with(iNZight::census.at.school.500, table(travel, gender))",
  //   RT.table([6, 2])
  // );
  // console.log("Table 2 ...");
  // console.log(RT.asTable(tbl2.data, [6, 2]));
  // if (tbl2.r_attributes) {
  //   console.log(tbl2.r_attributes.dimnames);
  // }

  // const iris = await R.eval("head(iris)", z.any());
  // console.log("Iris ...", iris);

  // // generic lists
  // const listWithoutNames = R.list(R.character(1));
  // type ListWithoutNames = z.infer<typeof listWithoutNames>;
  // const l1 = await R.eval("list('A', 'B', 'C')", listWithoutNames);
  // console.log("List 1:", l1);

  // const listWithNames = R.list(z.record(z.string(), R.character(1)));
  // type ListWithNames = z.infer<typeof listWithNames>;
  // const l2 = await R.eval("list(A = 'a', B = 'b', C = 'c')", listWithNames);
  // console.log("List 2:", l2);

  // const { data } = l2;
  // Object.keys(data).forEach((key) => {
  //   console.log(key, "=", data[key].data);
  // });

  // // data frames
  // const df = await R.eval(
  //   "data.frame(A = c('a', 'b', 'c'), B = c(1, 2, 3))",
  //   R.dataframe({
  //     A: RT.character(3),
  //     B: RT.numeric(3),
  //   })
  // );
  // console.log("Data Frame ...", df);

  // //   R.integer(3, {
  // //     dimnames: z.object({
  // //       "": R.character(),
  // //     }),
  // //   })
  // // );
  // // console.log("Table ...");
  // // console.log(tbl);
  // // console.log((tbl as any).json());
  // // console.log((tbl as any).json().r_attributes);

  // // the json method returns the type of value with attributes

  // // const tbl2 = await R.eval(
  // //   "table(iris$Species)",
  // //   integer({
  // //     dimnames: list({
  // //       "": character(["setosa", "versicolor", "virginica"]),
  // //     }),
  // //   })
  // // );
  // // console.log("Table 2...");
  // // console.log(tbl2);
  // // console.log(tbl2.json());
  // // const tblx = tbl2.json();

  // // const iris2 = await R.eval("iris");
  // // // @ts-ignore
  // // console.log(iris2.value.json());

  // // const iris = await R.eval(
  // //   "iris",
  // //   rtypes.dataframe({
  // //     "Sepal.Length": rtypes.numeric(),
  // //     "Sepal.Width": rtypes.numeric(),
  // //     "Petal.Length": rtypes.numeric(),
  // //     "Petal.Width": rtypes.numeric(),
  // //     Species: rtypes.factor(["setosa", "versicolor", "virginica"]),
  // //   })
  // // );

  // // const mu = await R.value(z.number()).eval("mean(1:5)");
  // // const numeric = z.number();
  // // const mu = await R.eval(
  // //   "mean(1:5)",
  // //   z.object({
  // //     type: z.literal("sexp"),
  // //     value: z.object({
  // //       type: z.literal("double_array"),
  // //       value: z.instanceof(Float64Array),
  // //       attributes: z.undefined(),
  // //       json: z.function().returns(z.number()),
  // //     }),
  // //   })
  // // );

  // // const x = await R.eval<any>("mean(1:5)");
  // // const x = await R.eval<any>("iris$Species[1:3]");
  // // console.log(x);
  // // console.log(x.value.attributes.value);
  // // console.log(x.value.json());

  // // const x = await R.eval<RClos<any, any>>("function(a, b) { 'hello world' }");
  // // console.log(x);
  // // console.log(x.value.value);
  // // console.log(x.value.value.formals.value);

  // // const x = await R.eval<number>("1 + 1");

  // // const oc = await R.ocap<{
  // //   add: (a: number, b: number) => Promise<number>;
  // // }>();
  // // const z = await oc.add(1, 2);
  // // console.log(z);
};

const ocapTest = async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

  // const oc = await R.ocap();

  const app = await R.ocap(ocapFuns);

  await app.tfail(1).catch((err) => {
    console.log("Nice: ", err);
  });

  const x1 = await app.t1(5);
  console.log("T1:", x1);

  const x2 = await app.t2(4);
  console.log("T2:", x2);

  // new syntax:
  const x3 = await app.t3(async (x) => 21 + x);
  console.log("T3:", x3);

  // T4: 26
  const x4 = await app.t4(5);
  console.log("T4:", x4);

  // T5: null
  const x5 = await app.t5(function (i) {
    return i * i;
  });
  console.log("T5:", x5);

  // T6: 25
  const [f6, i6] = await app.t6(5);
  const x6 = f6(i6);
  console.log("T6:", x6);

  // iris
  const iris = await app.iris();
  // console.log("Iris:", iris);

  // rng (functions from function)
  const { rnorm, runif, flip } = await app.rng();

  // this should happen automatically ....
  const x = await rnorm(5);
  console.log("RNG rnorm:", x);

  const y = await runif(5);
  console.log("RNG runif:", y);

  const coin = await flip();
  console.log("RNG flip:", coin === 1 ? "heads" : "tails");

  console.log(await app.sample_num(new Float64Array([1, 2, 3])));

  // const xf: string[] & { r_type: "string_array" } = ["a", "b", "c"] as any;
  // xf.r_type = "string_array";

  // const sx = as_vector(["a", "b", "c"]);
  // console.log(sx);
  // console.log(stringArray.safeParse(sx));
  // console.log(stringArray.safeParse(new Float64Array([1, 2, 3])));
  // console.log(stringArray.safeParse(["a", "b", "c"]));
  // console.log(stringArray.safeParse(as_vector(["a", "b", "c"])));

  // TODO: is this the right way to do this?
  // console.log(await app.sample_char(as_vector(["a", "b", "c"])));

  console.log(await app.print_input([1, 2, 3]));
  console.log(await app.print_input(new Int32Array([1, 2, 3])));

  console.log("\n----------DATAFRAME----------");
  // const { Robj } = R;
  // const irisDf = Robj.vector({
  //   "Sepal.Length": Robj.double(0),
  //   "Sepal.Width": Robj.double(0),
  //   "Petal.Length": Robj.double(0),
  //   "Petal.Width": Robj.double(0),
  //   Species: Robj.factor(["setosa", "versicolor", "virginica"]),
  // });
  // type IrisDf = z.infer<typeof irisDf>;

  const fac = await app.iris();
  console.log(fac.Species);
  console.log("Result...\n ", await app.print_input(fac.Species));

  // sending javascript functions to R
  // const progBar = new SingleBar({}, Presets.shades_classic);
  // progBar.start(100, 0);
  // const longresult = await app.longjob(async (x) => progBar.update(x));
  // progBar.stop();
  // console.log("Long job result:", longresult);

  // // some random numbers
  // const xrand = await app.randomNumbers();
  // console.log("Random numbers:", xrand);

  console.log("\n-------------- fit models --------------");
  const fit = await app.car_lm("mpg", "hp");
  console.log(await fit.coef());
  console.log(await fit.rsq());
};

(async () => {
  await noOcap();
  await ocapTest();
  process.exit(0);
})();
