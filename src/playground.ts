import RserveClient, { Robj } from "./index";
import { ocapFuns } from "../tests/r_files/oc";
import { z } from "zod";

import XT from "./types/index";
import { Presets, SingleBar } from "cli-progress";
import { objectWithAttributes } from "./types/helpers";
import _recursive_list from "./types/recursive";

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

const noOcap = async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  console.log("Connected to R");
  console.log(R.is_running());

  console.log("\n\n---- Null ----");
  console.log(await R.eval("NULL", XT.null()));

  console.log("\n\n---- Boolean ----");
  console.log(await R.eval("TRUE", XT.logical(1)));
  console.log(await R.eval("c(TRUE, FALSE, TRUE)", XT.logical(3)));
  console.log(await R.eval("logical()", XT.logical(0)));
  console.log(
    await R.eval(
      "structure(TRUE, some = 'thing')",
      XT.logical({ some: z.literal("thing") })
    )
  );

  console.log("\n\n---- Double ----");
  console.log(await R.eval("1.0", XT.numeric(1)));
  console.log(await R.eval("c(1, 2, 3)", XT.numeric(3)));
  console.log(await R.eval("numeric()", XT.numeric(0)));
  console.log(
    await R.eval(
      "structure(1.0, some = 'thing')",
      XT.numeric({ some: z.literal("thing") })
    )
  );

  console.log("\n\n---- Integer ----");
  console.log(await R.eval("1L", XT.integer(1)));
  console.log(await R.eval("1:5", XT.integer(5)));
  console.log(await R.eval("integer()", XT.integer(0)));
  const i4 = await R.eval(
    "structure(1L, some = 'thing')",
    XT.integer({
      some: Robj.character(1),
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
      XT.vector([XT.numeric(1), XT.integer(10), XT.character(1)])
    )
  );
  const v3 = await R.eval(
    "list(a = 1, b = 2, c = 3)",
    XT.vector({
      a: XT.numeric(1),
      b: XT.numeric(1),
      c: XT.numeric(1),
    })
  );

  // lists blahh
  // console.log("\n\n\n===============================\n\n");
  const r_list1 = await R.eval(
    "list(x = 5.3, y = factor(c('one', 'two')))",
    XT.vector()
  );
  // console.log(r_list1);

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
      XT.factor({ some: XT.character(1) })
    )
  );

  console.log(await R.eval("table(iris$Species)", XT.integer(3)));
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

  // ---------------------------------------------------
  // Recursive objects
  console.log("\n----------------------------------------------");
  console.log("\n--- RECURSIVE OBJECTS ---\n");

  // fully self-contained specification
  const recursiveList = (function () {
    const baseListType = z.object({
      value: XT.integer(1),
      r_type: z.literal("vector"),
      r_attributes: z.object({
        names: XT.character(),
      }),
    });
    type ListType = z.infer<typeof baseListType> & {
      subobj?: ListType;
    };

    const listType = XT.recursive_list<ListType>(baseListType, (self) => ({
      subobj: self.optional(),
    }));

    return listType;
  })();

  console.log("\nParse from IIFE ...");
  console.log(
    await R.eval(
      "list(value = 1L, subobj = list(value = 2L, subobj = list(value = 3L)))",
      recursiveList
    )
  );
};

const ocapTest = async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8781",
  });

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

  const myfac: Int32Array & {
    levels?: string[];
    r_type: "int_array";
    r_attributes: Record<string, any>;
  } = objectWithAttributes(new Int32Array([1, 2, 3, 1, 2, 3]), "int_array", {
    levels: ["setosa", "versicolor", "virginica"],
    class: "factor",
  });
  myfac.levels = ["setosa", "versicolor", "virginica"];
  console.log("Myfac...\n ", await app.print_input(myfac));

  // Passing functions as arguments to ocaps
  console.log("\n\n------------- functions as arguments --------\n");

  const progBar = new SingleBar({}, Presets.shades_classic);
  progBar.start(100, 0);
  const longresult = await app.longjob(
    (x: number, k: (err: any, res?: number) => void) => {
      progBar.update(x);
      k(null, x);
    }
  );

  progBar.stop();
  console.log("Long job result:", longresult);

  console.log("\n(fin) ---------------------------------------\n");

  // // // some random numbers
  // const xrand = await app.randomNumbers();
  // console.log("Random numbers:", xrand);

  // console.log("\n-------------- fit models --------------");
  // const fit = await app.car_lm("mpg", "hp");
  // const coefs = await fit.coef();
  // if (typeof coefs.r_attributes.names === "object") {
  //   coefs.r_attributes.names.forEach((name) => {
  //     console.log(name, ": ", coefs[name]);
  //   });
  // }
  // console.log(await fit.rsq());

  // console.log("\n-------------- overloads --------------");

  // const randomNumber = await app.sampler([1, 2, 3]); // number
  // const randomString = await app.sampler(["a", "b", "c"]); // string

  // const sampleSchema = [
  //   z.function(z.tuple([z.number().array()]), z.number()),
  //   z.function(z.tuple([z.string().array()]), z.string()),
  //   z.function(z.tuple([z.boolean().array()]), z.boolean()),
  // ];

  // function sample(x: number[]): number;
  // function sample(x: string[]): string;
  // function sample(x: boolean[]): boolean;
  // function sample(x: unknown) {
  //   if (!Array.isArray(x)) {
  //     throw new Error("Invalid input");
  //   }
  //   const x0 = x[0];
  //   if (typeof x0 === "number") {
  //     return sampleSchema[0].parse(x0);
  //   }
  //   if (typeof x0 === "string") {
  //     return sampleSchema[1].parse(x0);
  //   }
  //   if (typeof x0 === "boolean") {
  //     return sampleSchema[2].parse(x0);
  //   }
  //   throw new Error("Invalid input");
  // }

  // oc = R.ocap(sampleSchema);
  // const sample =

  // function with optional arguments
  console.log("\n\n------------- optional arguments --------\n");
  const optGiven = await app.optional(1);
  const optMissing = await app.optional(undefined);
  console.log("OptGiven: ", optGiven);
  console.log("OptMissing: ", optMissing);

  console.log("\n(fin) ----------------------------------------\n");
};

(async () => {
  // await noOcap();
  await ocapTest();
  process.exit(0);
})();
