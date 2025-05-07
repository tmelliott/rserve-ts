import { test, expect } from "vitest";
import { z } from "zod";
import _recursive_list from "./recursive";
import Robj from ".";

test("Recursive list with simple nesting", () => {
  const baseRecursiveListSchema = z.object({
    label: z.string(),
    heading: z.string().optional(),
    r_type: z.literal("vector"),
    r_attributes: z.object({
      names: z.string().or(z.string().array()),
    }),
  });

  type RecursiveList = z.infer<typeof baseRecursiveListSchema> & {
    sublist?: RecursiveList;
  };

  const validList = (x: RecursiveList): boolean => {
    if (x.heading) return true;
    if (!x.sublist) return false;
    return validList(x.sublist);
  };
  const recursiveListSchema = _recursive_list<RecursiveList>(
    baseRecursiveListSchema,
    (self) => ({
      sublist: self.optional(),
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
