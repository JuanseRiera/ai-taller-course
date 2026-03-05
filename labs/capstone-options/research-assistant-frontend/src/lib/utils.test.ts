import { cn, generateId } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names and resolves tailwind conflicts", () => {
      expect(cn("px-2", "px-4", "text-sm", "text-lg")).toBe("px-4 text-lg");
    });

    it("handles conditional values", () => {
      expect(cn("base", false && "hidden", "active")).toBe("base active");
    });
  });

  describe("generateId", () => {
    it("returns a 7 character id", () => {
      const id = generateId();
      expect(id).toHaveLength(7);
    });

    it("returns unique ids across calls", () => {
      const ids = new Set(Array.from({ length: 30 }, () => generateId()));
      expect(ids.size).toBe(30);
    });
  });
});
