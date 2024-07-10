import RserveClient, { type CallbackFromPromise } from "./index";
import { z } from "zod";
import { Character, Integer, List, Numeric, RTypes } from "./types";

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

  const tbl1 = await R.eval("table(iris$Species)");
  console.log("Table 1 ...");
  console.log(tbl1);

  const tbl2 = await R.eval(
    "with(iNZight::census.at.school.500, table(travel, gender))"
  );
  console.log("Table 2 ...");
  console.log(tbl2);
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

  // console.log(R.client);

  // // console.log(
  // R.client.ocap(() => {
  //   console.log("hello");
  // });
  // // );

  const oc = await R.ocap();

  const ocapFuns = {
    add: z
      .function(z.tuple([z.number(), z.number()]))
      .returns(z.promise(R.numeric(1))),
    newItem: z.function(z.tuple([z.string(), z.number()])).returns(
      z.promise(
        R.list({
          name: R.character(1),
          price: R.numeric(1),
          codes: R.numeric(5),
        })
      )
    ),
    randomNumbers: z.function().returns(z.promise(R.numeric(10))),
  };

  const app = await R.ocap(ocapFuns);
  const { data: x } = await app.add(1, 2);
  console.log(x);
};

(async () => {
  // await noOcap();
  await ocapTest();
  process.exit(0);
})();
