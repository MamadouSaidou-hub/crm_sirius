import { describe, expect, it } from "vitest";
import {
  currentPeriod,
  driftOf,
  freezeLines,
  hasDrift,
  isClosable,
} from "@/lib/payroll/closing";

describe("isClosable", () => {
  const now = new Date(2026, 10, 27); // 27 November 2026

  it("only a finished month can be closed", () => {
    expect(isClosable("2026-10", now)).toBe(true);
    expect(isClosable("2025-12", now)).toBe(true);
  });

  it("the current and future months cannot", () => {
    expect(isClosable("2026-11", now)).toBe(false);
    expect(isClosable("2026-12", now)).toBe(false);
  });

  it("becomes closable on the first day of the next month", () => {
    expect(isClosable("2026-11", new Date(2026, 11, 1))).toBe(true);
  });

  it("formats the current period", () => {
    expect(currentPeriod(new Date(2027, 0, 5))).toBe("2027-01");
  });
});

describe("freezeLines", () => {
  it("keeps id, name and the rounded total", () => {
    expect(
      freezeLines([
        { commercialId: "u-1", commercial: { name: "Awa Diop" }, total: 47_595.4 },
      ]),
    ).toEqual([{ commercialId: "u-1", name: "Awa Diop", total: 47_595 }]);
  });
});

describe("drift", () => {
  it("is zero when nothing changed, even with sub-franc rounding", () => {
    expect(driftOf(47_595, 47_595.3)).toBe(0);
    expect(hasDrift(47_595, 47_595.3)).toBe(false);
  });

  it("shows the difference when the figures moved", () => {
    expect(driftOf(47_595, 50_000)).toBe(2_405);
    expect(hasDrift(47_595, 50_000)).toBe(true);
    expect(driftOf(50_000, 47_595)).toBe(-2_405);
  });
});
