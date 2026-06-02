---
"rserve-ts": patch
---

fix: coerce length-1 R scalars to arrays for array-typed schemas

When R returns a length-1 vector, Rserve serialises it as a plain scalar (string, number, or boolean). Schemas declared as array types — `character(0L)`, `integer(0L)`, `numeric(0L)`, `logical(0L)` — now accept a scalar and coerce it to the expected array form, so zod validation no longer fails.
