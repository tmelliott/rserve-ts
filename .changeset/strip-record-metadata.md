---
"rserve-ts": minor
---

Strip r_type and r_attributes from record-like vector returns

Record vectors (`Robj.list(z.record(...))` / `ts_record()`) now return a plain `Record<string, T>` without Rserve metadata (`r_type`, `r_attributes`). Previously these internal properties leaked into the returned object, requiring manual filtering. The OCAP function wrapper was also fixed to avoid double-parsing results, which caused errors with nested OCAP returns.
