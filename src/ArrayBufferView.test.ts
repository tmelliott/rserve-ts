import { describe, expect, it } from "vitest";
import { EndianAwareDataView, my_ArrayBufferView } from "./ArrayBufferView";

describe("EndianDataView", () => {
  it("should have setters and getters", () => {
    const b = new ArrayBuffer(5);
    const view = new EndianAwareDataView(b);

    expect(view.view).toBeDefined();
    view.setInt16(0, 1);
    expect(view.getInt16(0)).toBe(1);
  });
});

describe("my_ArrayBufferView", () => {
  it("should create a view", () => {
    const b = my_ArrayBufferView(new ArrayBuffer(5), 0, 0);
    expect(b.offset).toBe(0);

    const x = b.make(DataView);
    expect(x).toBeDefined();
  });
});
