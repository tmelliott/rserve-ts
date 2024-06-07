type RObject<T extends string, V = unknown, A = undefined, J = V> = {
  type: T;
  value: V;
  attributes: A;
  json: () => J &
    (V extends Int32Array | Float64Array | {} ? { r_type: T } : {});
};

type RInteger = RObject<"int_array", Int32Array>;
type RNumeric = RObject<"double_array", Float64Array>;
type RBoolean = RObject<"bool_array", boolean[]>;
type RCharacter<V extends string[] = string[]> = RObject<"string_array", V>;

type RTaggedList<T extends Record<string, RObject<any>>> = RObject<
  "tagged_list",
  {
    [K in keyof T]: {
      name: K;
      value: T[K];
    };
  }
>;

type X = RTaggedList<{ names: RCharacter<["one", "two"]>; class: RCharacter }>;

type RVector<T extends Record<string, RObject<any>>> = RObject<
  "vector",
  T,
  keyof T extends string
    ? RTaggedList<{
        names: RCharacter<(keyof T)[]>;
      }>
    : never
>;

// maybe we can use zod to fix up the orders etc.
type Y = RVector<{ x: RCharacter<["one", "two"]>; y: RNumeric }>;
type x = Y["json"];
