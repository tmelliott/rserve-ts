import { makeBasicObject, makeTypedObject } from "./makeBasic";

const r_string = makeTypedObject(makeBasicObject<string>("string"), {
  json: function (resolver?: (value: string) => string) {
    return this.value;
  },
});
type RString = ReturnType<typeof r_string>;

const basicStringArray = makeBasicObject<
  string[],
  // these attributes are optional, and aid only in writing the json method
  [
    {
      name: "class";
      value: RString;
    }
  ]
>("string");

const string_array = makeTypedObject(basicStringArray, {
  json: function (resolver?: (value: string) => string) {
    if (this.value.length === 1) {
      if (!this.attributes) return this.value[0];
      if (
        this.attributes.value[0].name === "class" &&
        (this.attributes.value[0].value.value as string).indexOf(
          "javascript_function"
        ) !== -1
      ) {
        if (!resolver) throw new Error("resolver required");
        return this.value[0] ? resolver(this.value[0]) : null;
      }
    }
    return this.value;
  },
});

const myString = string_array(["hello", "world"], {
  type: "tagged_list",
  value: [
    {
      name: "class",
      value: string_array(["character"]),
    },
  ],
});
console.log(myString);
const sJ = myString.json();
console.log(sJ);
if (typeof sJ === "string") {
  console.log(sJ);
} else if (sJ) {
  console.log("Type:", sJ.r_type);
  console.log(sJ.r_attributes);
} else {
  console.log("null");
}

// the API I want:
const string_array2 = make_basic<string[]>("string").proto<{
  name: "class";
  value: unknown;
}>((value) => {
  return value;
});
