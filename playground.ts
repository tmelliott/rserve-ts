// Playground: reproduce the inzight schema to find what causes TS to spin
// Run: npx tsc --noEmit playground.ts --skipLibCheck

import Robj from './src/types';
import { z } from 'zod';

// ---- Level 1: Simple ocap (should be fine) ----
const simple = Robj.ocap([z.string()], Robj.null());
type TSimple = z.infer<typeof simple>;

// ---- Level 2: ocap with js_function arg ----
const withJsFunc = Robj.ocap(
  [Robj.js_function([z.string()], z.null()), z.string()],
  Robj.character(1)
);
type TWithJsFunc = z.infer<typeof withJsFunc>;

// ---- Level 3: A property-like structure (register/get/set) ----
const prop = Robj.list({
  register: Robj.ocap(
    [Robj.js_function([z.string()], z.null()), z.string()],
    Robj.character(1)
  ),
  get: Robj.ocap([], Robj.character(1)),
  set: Robj.ocap([z.string()], Robj.null()),
});
type TProp = z.infer<typeof prop>;

// ---- Level 4: Widget with properties ----
const widgetWithProps = Robj.ocap(
  [z.union([
    Robj.js_function([z.object({ dim: z.union([z.instanceof(Int32Array), z.undefined()]) })], z.null()),
    z.undefined()
  ])],
  Robj.list({
    properties: Robj.list({
      dim: Robj.list({
        register: Robj.ocap([Robj.js_function([z.instanceof(Int32Array)], z.null()), z.string()], Robj.character(1)),
        get: Robj.ocap([], Robj.integer(3)),
        set: Robj.ocap([z.instanceof(Int32Array)], Robj.null()),
      }),
    }),
    children: Robj.list(),
    methods: Robj.list({
      setDim: Robj.ocap([z.number(), z.number(), z.number()], Robj.null()),
    }),
  })
);
type TWidgetWithProps = z.infer<typeof widgetWithProps>;

// ---- Level 5: Nested widget (ctrl -> plot) ----
const ctrlWidget = Robj.ocap(
  [z.union([
    Robj.js_function([z.object({
      variables: z.union([z.union([z.string(), z.array(z.string())]), z.undefined()]),
      vars: z.union([z.object({
        v1: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
        v2: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
        v3: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
      }), z.undefined()]),
    })], z.null()),
    z.undefined()
  ])],
  Robj.list({
    properties: Robj.list({
      variables: Robj.list({
        register: Robj.ocap([Robj.js_function([z.union([z.string(), z.array(z.string())])], z.null()), z.string()], Robj.character(1)),
        get: Robj.ocap([], Robj.character()),
        set: Robj.ocap([z.union([z.string(), z.array(z.string())])], Robj.null()),
      }),
      vars: Robj.list({
        register: Robj.ocap([Robj.js_function([z.object({
          v1: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
          v2: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
          v3: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
        })], z.null()), z.string()], Robj.character(1)),
        get: Robj.ocap([], Robj.list({
          v1: Robj.list({ selected: z.union([Robj.character(1), Robj.null()]), available: Robj.character() }),
          v2: Robj.list({ selected: z.union([Robj.character(1), Robj.null()]), available: Robj.character() }),
          v3: Robj.list({ selected: z.union([Robj.character(1), Robj.null()]), available: Robj.character() }),
        })),
        set: Robj.ocap([z.object({
          v1: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
          v2: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
          v3: z.object({ selected: z.union([z.string(), z.null()]), available: z.union([z.string(), z.array(z.string())]) }),
        })], Robj.null()),
      }),
    }),
    children: Robj.list({
      plotWidget: widgetWithProps,
    }),
    methods: Robj.list({
      setVariable: Robj.ocap([z.string(), z.string()], Robj.null()),
    }),
  })
);
type TCtrlWidget = z.infer<typeof ctrlWidget>;

// ---- Level 6: Full document (top-level, contains ctrl widget) ----
const iNZDocument = Robj.ocap(
  [z.union([
    Robj.js_function([z.object({
      name: z.union([z.string(), z.undefined()]),
      code: z.union([z.union([z.string(), z.array(z.string())]), z.undefined()]),
    })], z.null()),
    z.undefined()
  ])],
  Robj.list({
    properties: Robj.list({
      name: Robj.list({
        register: Robj.ocap([Robj.js_function([z.string()], z.null()), z.string()], Robj.character(1)),
        get: Robj.ocap([], Robj.character(1)),
        set: Robj.ocap([z.string()], Robj.null()),
      }),
      code: Robj.list({
        register: Robj.ocap([Robj.js_function([z.union([z.string(), z.array(z.string())])], z.null()), z.string()], Robj.character(1)),
        get: Robj.ocap([], Robj.character()),
        set: Robj.ocap([z.union([z.string(), z.array(z.string())])], Robj.null()),
      }),
    }),
    children: Robj.list({
      ctrlWidget,
    }),
    methods: Robj.list({
      loadData: Robj.ocap([z.string()], Robj.null()),
      setName: Robj.ocap([z.string()], Robj.character(1)),
    }),
  })
);
type TINZDocument = z.infer<typeof iNZDocument>;

// ---- Now simulate useWidget from react-rserve ----

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type WidgetProperty<T = any, R = any> = {
  get: () => Promise<T>;
  set: (x: R) => Promise<void>;
  register: (
    f: (v: T, k: (err: string | null, res: null) => void) => void,
    id: string
  ) => Promise<string>;
};

type WidgetState<P extends Record<string, any>> = Expand<{
  [K in Exclude<keyof P, "r_type" | "r_attributes">]:
    | Parameters<P[K]["set"]>[0];
}>;

// Original strict signature (what useWidget had before our union change)
function useWidgetStrict<
  P extends Record<string, any>,
>(
  ctor: (
    f: (
      v: Partial<Expand<WidgetState<P>>>,
      k: (err: string | null, res: null) => void
    ) => void
  ) => Promise<{ properties?: P }>
): void {
  // no-op, just testing types
}

// Loose union signature (our fix)
function useWidgetLoose<
  P extends Record<string, any>,
>(
  ctor: (
    f: ((
      v: Partial<Expand<WidgetState<P>>>,
      k: (err: string | null, res: null) => void
    ) => void) | ((v: any, k: (...args: any[]) => void) => void)
  ) => Promise<{ properties?: P }>
): void {
  // no-op, just testing types
}

// Test: does calling useWidget with the INFERRED types hang TS?
// (The real app passes z.infer'd values, not the Zod schemas themselves)

declare const widgetInstance: TWidgetWithProps;
declare const ctrlInstance: TCtrlWidget;
declare const docInstance: TINZDocument;

// A: simple widget - strict
useWidgetStrict(widgetInstance);

// B: simple widget - loose
useWidgetLoose(widgetInstance);

// C: ctrl widget - strict
useWidgetStrict(ctrlInstance);

// D: ctrl widget - loose
useWidgetLoose(ctrlInstance);

// E: full document - strict
useWidgetStrict(docInstance);

// F: full document - loose
useWidgetLoose(docInstance);

export { simple, withJsFunc, prop, widgetWithProps, ctrlWidget, iNZDocument };
