/**
 * Live session furniture (DESIGN.md §6.5; RF-WKD-07, RF-CMD-03, RF-CMD-04, RNF-09):
 * the timing tower marks your cars and the knockout cut, the feed filters radio from
 * track news, the playback bar offers the five speeds, the lap chart draws your cars.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Feed, PlaybackBar, TimingTower } from "./Broadcast";
import LapChart from "./LapChart";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const rows = [
  { id: "a", position: 1, code: "LEC", color: "#dc0000", value: "1:30.000", flags: { user: true, fastest: true } },
  { id: "b", position: 2, code: "VER", color: "#1e41ff", value: "+0.200", flags: {} },
  { id: "c", position: 3, code: "ALO", color: "#006f62", value: "+0.400", flags: { danger: true } },
];

describe("live session furniture", () => {
  it("tower: own car, knockout cut, picking a car (RNF-09)", () => {
    const onPick = jest.fn();
    const { container } = render(<TimingTower label="Torre" title="Q1" subtitle="5:00" rows={rows} onPick={onPick} />);
    expect(container.querySelector(".lv-row.is-user")).toHaveTextContent("LEC");
    expect(container.querySelector(".lv-row.is-cut")).toHaveTextContent("ALO");
    fireEvent.click(screen.getByText("VER"));
    expect(onPick).toHaveBeenCalledWith("b");
  });

  it("feed: radio and track filters (RF-CMD-03)", () => {
    const entries = [
      { key: "1", lap: 3, kind: "radio", text: "Box this lap" },
      { key: "2", lap: 2, kind: "race", text: "Safety car" },
    ];
    render(<Feed entries={entries} />);
    expect(screen.getByText("Box this lap")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("tab")[1]);
    expect(screen.queryByText("Safety car")).toBeNull();
  });

  it("playback: the five race speeds (RF-CMD-04)", () => {
    const onSpeed = jest.fn();
    render(<PlaybackBar playing onPlay={() => {}} speeds={[1, 2, 4, 8, 16]} speed={4} onSpeed={onSpeed} cameraLabel="TV" onCamera={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    fireEvent.click(screen.getByRole("radio", { name: "×16" }));
    expect(onSpeed).toHaveBeenCalledWith(16);
  });

  it("lap chart: your cars on top of the field (RF-WKD-07)", () => {
    const chart = {
      laps: 3,
      cars: [
        { id: "a", name: "Charles Leclerc", color: "#dc0000", isUser: true, grid: 2, positions: [1, 1, 1], stops: [2] },
        { id: "b", name: "Max Verstappen", color: "#1e41ff", isUser: false, grid: 1, positions: [2, 2, 2], stops: [] },
      ],
    };
    const { container } = render(<LapChart chart={chart} />);
    expect(container.querySelectorAll(".wk-lapchart__line")).toHaveLength(2);
    expect(container.querySelectorAll(".wk-lapchart__stop")).toHaveLength(1);
  });
});
