import { z } from "zod";

// recursive types, i.e., lists that can contain instances of themselves
// e.g., Person can have {name: string, dob: Date, ..., children: Person[]}
// in the currently version of Zod, the class needs to be build progressively
// TODO: in the new version of Zod, this is easier :D

function _recursive_list<T>(
  baseSchema: z.ZodObject<any>,
  extendFn: (self: z.ZodType<any>) => z.ZodRawShape
): z.ZodType<T> {
  const lazySchema: z.ZodType<any> = z.lazy(() => {
    const extensions = extendFn(lazySchema);
    return baseSchema.extend(extensions);
  });

  return lazySchema as z.ZodType<T>;
}

export default _recursive_list;
