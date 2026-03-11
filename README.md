# rserve-ts: Typescript wrapper for rserve library

[![NPM Version](https://img.shields.io/npm/v/rserve-ts)](https://www.npmjs.com/package/rserve-ts)

This is a typescript wrapper for the rserve library. The goal is to provide modern async API alternatives with typescript support (via zod).

The package wraps the main connection function and allows users to evaluate arbitrary R code on the server. This will be extended to full OCAP support.

## Installation

```bash
npm install rserve-ts
```

## Usage

You need to have an Rserve server running for the following to work.

```typescript
import RserveClient from "rserve-ts";

(async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

  const rversion = await R.eval("R.version.string", R.character());
  console.log("Connected to ", rversion);
})();
```

## Local Development

When using a local build of `rserve-ts` in another project (e.g., `react-rserve` or an app), **do not symlink** the full repo into `node_modules/`. TypeScript's language server will follow the symlink into the source tree and OOM on deeply nested Zod schemas.

Instead, use `npm pack` to create a tarball containing only the published files (`dist/`, `package.json`):

```bash
# Build and pack
npm run pack-local

# Install into a consumer project
rm -rf /path/to/project/node_modules/rserve-ts
tar xzf /tmp/rserve-ts-*.tgz -C /tmp/rserve-ts-local
cp -r /tmp/rserve-ts-local/package /path/to/project/node_modules/rserve-ts
```

Repeat after each rebuild of `rserve-ts`.

## OCAP mode

In OCAP mode, only pre-defined functions can be called. This is useful for restricting the R code that can be executed on the server, or for developing applications.

[Zod](https://zod.dev) is used to define function schemas, with additional R types defined.

```r
# ocap.R
library(Rserve)
oc.init <- function() {
  ocap(function() {
    list(
      # Ocaps are functions that javascript can call
      add <- ocap(function(a, b) {
        a + b
      }),
      dist <- ocap(function(which = c('normal', 'uniform')) {
        # Ocaps can return new ocaps, too!
        # This could be useful for progressively revealing functionality, etc.
        switch(which,
          normal = list(sample = ocap(function(n) rnorm(n))),
          uniform = list(sample = ocap(function(n) runif(n)))
        )
      })
    )
  })
}
```

```typescript
// app.ts
import { z } from "zod";
import { Robj } from "../index";

export const appSchema = {
  add: Robj.ocap([z.number(), z.number()], Robj.numeric(1)),
  dist: Robj.ocap(
    [z.enum(["normal", "uniform"])],
    Robj.list({
      sample: Robj.ocap([z.number()], Robj.numeric()),
    })
  ),
};
```

```typescript
// app.ts
import R from "../index";
import { appSchema } from "./app";

(async () => {
  const s = await R.create({ host: "ws://localhost:8181" });
  const app = await s.ocap(appSchema);

  const sum = await app.add(16, 32);
  const cart = { total: sum };
  cart.total;

  const { sample } = await app.dist("uniform");
  const x = await sample(235);
  if (typeof x === "number") x + 5;
  else {
    // deal with an array
  }
})();
```

## Record return values (named lists)

When an OCAP method return type is a **record** (named list), e.g. `Robj.list(z.record(z.string(), Robj.character(1)))` or the R-side equivalent `ts_record(ts_character(1))`, the value returned to TypeScript is a **plain object** without Rserve metadata. The schema layer strips `r_type` and `r_attributes` so you get a clean `Record<string, T>` suitable for `Object.entries()`, spreading, or use in React etc. Other vector/list shapes (e.g. factors, lists of structs) still include metadata where needed.
