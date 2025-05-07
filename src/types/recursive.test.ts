import { test, expect } from "vitest";
import { z } from "zod";
import _recursive_list from "./recursive";
import { Unify, UnifyOne } from "./helpers";

test("Recursive list with simple nesting", () => {
  const baseRecursiveListSchema = z.object({
    label: z.string(),
    r_type: z.literal("vector"),
    r_attributes: z.object({
      names: z.string().or(z.string().array()),
    }),
  });

  type RecursiveList =
    | (z.infer<typeof baseRecursiveListSchema> & {
        sublist: RecursiveList;
      })
    | (z.infer<typeof baseRecursiveListSchema> & {
        heading: string;
      });

  const validList = (x: {}): boolean => {
    if ("heading" in x && typeof x.heading === "string") return true;
    if ("sublist" in x && typeof x.sublist === "object" && x.sublist)
      return validList(x.sublist);
    return false;
  };
  const recursiveListSchema = _recursive_list<RecursiveList>(
    baseRecursiveListSchema,
    (self) => ({
      sublist: self.optional(),
      heading: z.string().optional(),
    })
  ).refine(validList, {
    message: "One of heading or sublist must be specified",
  });

  const myList = recursiveListSchema.parse({
    label: "hello",
    sublist: {
      label: "hello",
      sublist: {
        label: "final",
        heading: "woop",
        r_type: "vector",
        r_attributes: {
          names: "label",
        },
      },
      r_type: "vector",
      r_attributes: {
        names: ["label", "sublist"],
      },
    },
    r_type: "vector",
    r_attributes: {
      names: ["label", "sublist"],
    },
  });
});
