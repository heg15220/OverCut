/**
 * The R&D screen on parts (RF-DEV-01..08, RF-SIM-14): loadout per car, designs
 * and their stats, a design commissioned at a pace, units built and fitted,
 * expertise, engine supply, aero resources from 2021 and units per driver.
 */

import React from "react";
import { act as reactAct, fireEvent, render, screen, within } from "@testing-library/react";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { closeWeekend, createCareer, createContext, simulateWeekend } from "../engine/career";
import Car from "./Car";
import { ManagerContext } from "./context";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => ["./Ferrari.svg", "./McLaren.png"];
  return { sourceTictactoeImages: resolve };
});

const context = createContext(fallbackBootstrap, reference);

const Harness = ({ career }) => {
  const [, setVersion] = React.useState(0);
  const act = (fn) => {
    const result = fn(career);
    setVersion((value) => value + 1);
    return result;
  };
  return (
    <ManagerContext.Provider value={{ career, act }}>
      <Car />
    </ManagerContext.Provider>
  );
};

describe("Car screen", () => {
  it("shows the loadout, designs, supply and units, and commissions a design at a pace", () => {
    const career = createCareer(context, { year: 2016, teamId: "williams", seed: "ui-car" });
    render(<Harness career={career} />);
    expect(screen.getByText(/car loadout/i)).toBeInTheDocument();
    expect(screen.getByText(/designs and manufacturing/i)).toBeInTheDocument();
    expect(screen.getByText(/design office expertise/i)).toBeInTheDocument();
    expect(screen.getByText(/customer: cannot develop the engine/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MGU-H/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("radio", { name: /front wing/i }));
    fireEvent.click(screen.getByRole("radio", { name: /intense/i }));
    fireEvent.click(screen.getByRole("button", { name: /commission design/i }));
    expect(career.rd.designs).toHaveLength(1);
    expect(career.rd.designs[0]).toMatchObject({ part: "frontWing", pace: "intense" });
  });

  it("builds two units of a design and fits them, and shows aero allocation from 2021", () => {
    const career = createCareer(context, { year: 2024, teamId: "williams", seed: "ui-car-2" });
    const { unmount } = render(<Harness career={career} />);
    expect(screen.getByText(/allocation by position/i)).toBeInTheDocument();
    const row = screen.getByTestId("design-frontWing");
    row.open = true;
    fireEvent.click(within(row).getByRole("button", { name: /build 2 and fit/i }));
    expect(career.rd.built).toHaveLength(2);
    unmount();
    reactAct(() => {
      simulateWeekend(career);
      closeWeekend(career);
    });
    const parts = career.world.teams.williams.parts;
    expect(parts.items.filter((item) => item.part === "frontWing")).toHaveLength(2 + 2 + 2);
  });
});
