import { test, expect } from "vitest";
import { z } from "zod";
import _recursive_list from "./recursive";

test("Recursive list with simple nesting", () => {
  const baseRecursiveListSchema = z.object({
    label: z.string(),
    r_type: z.literal("vector"),
    r_attributes: z.object({
      names: z.union([z.string(), z.string().array()]),
    }),
  });

  type RecursiveList = z.infer<typeof baseRecursiveListSchema> &
    (
      | {
          sublist: RecursiveList;
        }
      | {
          heading: string;
        }
    );

  const recursiveListSchema = _recursive_list<RecursiveList>(
    baseRecursiveListSchema,
    (self) => ({
      sublist: self,
    })
  ).or(
    baseRecursiveListSchema.extend({
      heading: z.string(),
    })
  );

  const myList: z.infer<typeof recursiveListSchema> = {
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
  };
});
