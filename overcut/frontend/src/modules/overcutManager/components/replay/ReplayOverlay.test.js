/**
 * CAM-3 replays (F1M24-GAMEPLAY §2.5): the overlay over a replay - OverCut's own sting at both
 * ends, a label in words (RNF-09: never colour alone), the driver, and skip (button or Escape).
 * ES and EN texts (RNF-08).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ReplayOverlay, { replayLabel } from "./ReplayOverlay";
import { createReplayBuffer, planReplay, recordReplay } from "./replayBuffer";

const buffer = createReplayBuffer();
for (let tau = 0; tau <= 60; tau += 1) recordReplay(buffer, tau, ["a", "b"], (id, t) => ({ x: t, y: 0, progress: t / 90, heading: 0 }));
const plan = planReplay({ trigger: "pass", event: { type: "pass", carId: "a", otherId: "b" }, at: 50 }, buffer, { year: 2024, seed: 1 });
const names = { a: "Driver A", b: "Driver B" };

describe("ReplayOverlay", () => {
  it("shows the sting first, then the label and the drivers, and nothing once it is done", () => {
    const { rerender, container } = render(<ReplayOverlay plan={plan} elapsed={0} names={names} />);
    expect(container.querySelector(".mn-replay__sting")).not.toBeNull();
    rerender(<ReplayOverlay plan={plan} elapsed={plan.stingSec + 1} names={names} />);
    expect(container.querySelector(".mn-replay__sting")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(replayLabel("pass"));
    expect(screen.getByRole("status").textContent).toContain("Driver A · Driver B");
    rerender(<ReplayOverlay plan={plan} elapsed={plan.totalSec + 1} names={names} />);
    expect(screen.queryByTestId("replay-overlay")).toBeNull();
  });

  it("skips with the button and with Escape", () => {
    const onSkip = jest.fn();
    render(<ReplayOverlay plan={plan} elapsed={plan.stingSec + 1} names={names} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onSkip).toHaveBeenCalledTimes(2);
  });

  it("names every trigger in words", () => {
    ["pass", "mistake", "dnf", "pitOther", "finish", "other"].forEach((trigger) => expect(replayLabel(trigger).length).toBeGreaterThan(3));
    expect(new Set(["pass", "mistake", "dnf", "pitOther", "finish"].map(replayLabel)).size).toBe(5);
  });

  it("draws nothing without a plan", () => {
    render(<ReplayOverlay plan={null} />);
    expect(screen.queryByTestId("replay-overlay")).toBeNull();
  });
});
