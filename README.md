# rserve-ts: Typescript wrapper for rserve library

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
