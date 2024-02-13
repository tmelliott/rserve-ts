import { describe, expect, it } from "vitest";
import RserveError from "./RserveError";

describe("Errors have the right shape", () => {
  it("Has a message string", () => {
    expect(new RserveError("test", -1).message).toBe("test");
  });
  it("Has a status code", () => {
    expect(new RserveError("test", -1).status_code).toBe(-1);
  });
});
