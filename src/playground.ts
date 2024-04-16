import { RObject } from "./Robj";
import create from "./Rserve";
import util from "util";

type Vector<TValue> = RObject<TValue[], TValue>;

type String = RObject<string, string>;
type StringVector = Vector<string>;
type Number = RObject<number, number>;
type NumberVector = Vector<number>;
type Bool = RObject<boolean, boolean>;
type BoolVector = Vector<boolean>;

type ListType<T> = {
  [K in keyof T]: RObject<T[K], T[K]>;
};
type List<T> = RObject<ListType<T>, ListType<T>>;

const run = async () => {
  const r = await create({
    host: "ws://localhost:8081",
  });

  // get R version
  const version = await r.eval<String>("R.version.string");
  console.log("Connected to ", version.value.json());

  const letters = await r.eval<StringVector>("letters");
  console.log("letters: ", letters.value.json());

  const namedVector = await r.eval<NumberVector>("c(a = 1, b = 2)");
  console.log("named vector: ", namedVector.value.json());
  console.log(util.inspect(namedVector, false, null, true));

  // a simple list
  const list = await r.eval<List<{ a: String; b: StringVector }>>(
    "list(a = 'foo', b = 1:10)"
  );
  console.log("List: ", list.value.json());
  console.log(util.inspect(list, false, null, true));

  // a list with attributes
  const lmFit = await r.eval<List<unknown>>(
    "lm(Sepal.Length ~ Sepal.Width, data = iris)"
  );
  console.log("lmFit: ", util.inspect(lmFit, false, null, true));
  console.log("lmFit: ", lmFit.value.json());

  process.exit(0);
};

run();
