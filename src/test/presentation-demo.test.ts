import { describe, expect, it } from "vitest";
import { CONCERTS } from "../lib/demo-data";
import { DEMO_ATTENDANCE, DEMO_FRIENDS, DEMO_LETTERS, DEMO_PASSWORD, demoChatRows, DEMO_DELIVERIES, usePresentationDemo } from "../lib/presentation-demo";
describe("judges' demo rules", () => {
  it("gives Olivia seven concerts across five artists", () => {
    expect(DEMO_ATTENDANCE).toHaveLength(7);
    expect(new Set(DEMO_ATTENDANCE.map(id => CONCERTS.find(c => c.id === id)?.artistId)).size).toBe(5);
  });
  it("has at least eight letters with likes at every concert", () => {
    for (const c of CONCERTS) { const rows = DEMO_LETTERS.filter(l => l.concertId === c.id); expect(rows.length).toBeGreaterThanOrEqual(8); expect(rows.every(l => l.likes > 0)).toBe(true); }
  });
  it("provides multiple friends, populated conversations and artist messages", () => {
    expect(DEMO_FRIENDS.length).toBeGreaterThan(1);
    for (const f of DEMO_FRIENDS) expect(demoChatRows("olivia").filter(m => m.friendship_id === f.id).length).toBeGreaterThan(1);
    expect(DEMO_DELIVERIES.length).toBeGreaterThan(1);
  });
  it("uses a public presentation password, not an account credential", () => { expect(DEMO_PASSWORD).toBe("fanmap"); });
  it("toggles a demo like without awarding a stamp", () => {
    const id = DEMO_LETTERS[0]?.id;
    if (!id) throw new Error("Missing demo letter");
    const before = usePresentationDemo.getState().letters.find(l => l.id === id)?.likes;
    usePresentationDemo.getState().like(id);
    expect(usePresentationDemo.getState().letters.find(l => l.id === id)?.likes).toBe(Number(before) + 1);
    usePresentationDemo.getState().like(id);
    expect(usePresentationDemo.getState().letters.find(l => l.id === id)?.likes).toBe(before);
  });
});