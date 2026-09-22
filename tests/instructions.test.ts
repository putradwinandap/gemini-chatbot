import { describe, expect, it } from "vitest";
import { instructionList, isSystemInstructionId } from "@/constants/instructions";
describe("instructions", () => {
  it("contains all MVP instruction options", () => expect(instructionList.map((item) => item.id)).toEqual(["general", "coding", "travel", "casual", "writing", "study"]));
  it("rejects unknown ids", () => expect(isSystemInstructionId("unknown")).toBe(false));
});
