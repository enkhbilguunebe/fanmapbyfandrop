import { describe, expect, it } from "vitest";
import { canParticipate, validReelDuration, sharingActive } from "@/lib/eligibility";

describe("FanMap eligibility and privacy", () => {
  it("upcoming activities accept a ticket without awarding attendance", () => {
    expect(canParticipate(false, true, false)).toBe(true);
    expect(canParticipate(false, false, false)).toBe(false);
  });
  it("past activities require attendance even with a ticket", () => {
    expect(canParticipate(true, true, false)).toBe(false);
    expect(canParticipate(true, false, true)).toBe(true);
  });
  it("reels allow at most ten seconds", () => {
    expect(validReelDuration(10)).toBe(true);
    expect(validReelDuration(10.01)).toBe(false);
    expect(validReelDuration(0)).toBe(false);
  });
  it("a thirty-minute session expires at its exact deadline", () => {
    const start = Date.parse("2026-10-18T15:00:00Z");
    const expiry = "2026-10-18T15:30:00Z";
    expect(sharingActive("active", expiry, start + 30 * 60000 - 1)).toBe(true);
    expect(sharingActive("active", expiry, start + 30 * 60000)).toBe(false);
  });
  it("stopping immediately overrides a future expiry", () => {
    expect(sharingActive("stopped", "2026-10-18T15:30:00Z", Date.parse("2026-10-18T15:05:00Z"))).toBe(false);
  });
});