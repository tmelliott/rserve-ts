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

## OCAP mode

In OCAP mode, only pre-defined functions can be called. This is useful for restricting the R code that can be executed on the server, or for developing applications.

[Zod](https://zod.dev) is used to define function schemas, with additional R types defined.

```typescript

```
