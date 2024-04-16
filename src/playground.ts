import { RObject } from "./Robj";
import create from "./Rserve";
import util from "util";

type Vector<TValue> = RObject<TValue[], TValue | TValue[]>;

type String = RObject<string, string>;
type StringVector = Vector<string>;
type Number = RObject<number, number>;
type NumberVector = Vector<number>;
type Bool = RObject<boolean, boolean>;
type BoolVector = Vector<boolean>;

type List<
  T = {
    [key: string]: unknown;
  }
> = RObject<
  Vector<
    {
      [K in keyof T]: RObject<T[K], T>;
    }[keyof T]
  >,
  {
    [K in keyof T]: T[K];
  }
>;

type lmType = List<{
  coefficients: NumberVector;
}>;

const run = async () => {
  const r = await create({
    host: "ws://localhost:8081",
  });

  // get R version
  const version = await r.eval<String>("R.version.string");
  console.log("Connected to ", version.value.json());

  const letters = await r.eval<StringVector>("letters");
  const lettersValue = letters.value.json();
  console.log("letters: ", lettersValue);

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
  const lmFit = await r.eval<List>(
    "lm(Sepal.Length ~ Sepal.Width, data = iris)"
  );
  //   console.log("lmFit: ", util.inspect(lmFit, false, null, true));
  //   const lmFitValue = lmFit.value.json();
  //   console.log("lmFitValue: ", lmFitValue);

  // but e.g., if all I want are the coefficients, I can do this:

  const lmFit2 = await r.eval<List<{ coefficients: NumberVector }>>(
    "lm(Sepal.Length ~ Sepal.Width, data = iris)"
  );
  // and get nice typescript completion:
  console.log("FIT2: ", lmFit2);
  const lmFit2Names = lmFit2.value.attributes!.value[0].value.value as string[];
  lmFit2.value.value;
  [lmFit2Names.indexOf("coefficients")];
  console.log("L1: ", lmFit2.value.attributes?.value[0].value.value);
  const coefs = lmFit2.value.json().coefficients;
  console.log("coefficients: ", coefs);

  process.exit(0);
};

run();
