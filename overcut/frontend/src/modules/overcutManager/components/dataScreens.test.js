/**
 * The data screens (DESIGN.md §6.3) after a few simulated weekends:
 * Standings (RF-WKD-07: both tables, points by round, results matrix),
 * Calendar (rounds, detail, era rules, classification sheet), Market
 * (RF-STF-02..04: filters, shortlist, driver card) and Staff (RF-STF-01: hire).
 */

import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { closeWeekend, createCareer, createContext, simulateWeekend } from "../engine/career";
import { ManagerContext } from "./context";
import Standings from "./Standings";
import Calendar from "./Calendar";
import Market from "./Market";
import Staff from "./Staff";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => [];
  return { sourceTictactoeImages: resolve };
});

const context = createContext(fallbackBootstrap, reference);

const careerAfter = (weekends) => {
  const career = createCareer(context, { year: 2024, teamId: "williams", seed: "screens1" });
  for (let k = 0; k < weekends; k += 1) {
    simulateWeekend(career);
    closeWeekend(career);
  }
  return career;
};

const mount = (Screen, career) => {
  const act = (fn) => fn(career);
  return render(
    <ManagerContext.Provider value={{ career, act, version: 0, go: () => {} }}>
      <Screen />
    </ManagerContext.Provider>,
  );
};

describe("data screens", () => {
  const career = careerAfter(3);

  it("Standings shows both championships, the chart and the results matrix", () => {
    mount(Standings, career);
    expect(screen.getByRole("img", { name: /cumulative points|puntos acumulados/i })).toBeInTheDocument();
    expect(screen.getAllByRole("table").length).toBe(2);
    fireEvent.click(screen.getByRole("tab", { name: /constructors|constructores/i }));
    expect(screen.getAllByText("Williams").length).toBeGreaterThan(0);
  });

  it("Standings says so before the first race", () => {
    mount(Standings, createCareer(context, { year: 2024, teamId: "williams", seed: "screens2" }));
    expect(screen.getAllByText(/no race has been run yet|aún no se ha corrido/i).length).toBeGreaterThan(0);
  });

  it("Calendar lists the rounds, the era rules and opens a classification", () => {
    mount(Calendar, career);
    expect(screen.getAllByRole("button", { name: /^1\. /i }).length).toBe(1);
    expect(screen.getByText(/2024 rules|reglamento 2024/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^1\. /i }));
    fireEvent.click(screen.getByRole("button", { name: /full classification|clasificación completa/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Market filters, shortlists and shows the driver card", () => {
    mount(Market, career);
    const before = career.market.shortlist.length;
    fireEvent.click(screen.getAllByRole("button", { name: /^shortlist |^seguir a /i })[0]);
    expect(career.market.shortlist.length).toBe(before + 1);
    expect(screen.getByRole("button", { name: /negotiate|negociar/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /contracted|con contrato/i }));
    expect(screen.getByRole("tab", { name: /contracted|con contrato/i })).toHaveAttribute("aria-selected", "true");
  });

  it("Staff hires a candidate for the selected role", () => {
    mount(Staff, career);
    const table = screen.getAllByRole("table")[1];
    const before = career.staff.technical.name;
    fireEvent.click(within(table).getAllByRole("button", { name: /hire|contratar/i })[0]);
    expect(career.staff.technical.name).not.toBe(before);
  });
});
