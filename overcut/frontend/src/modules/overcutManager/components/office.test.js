/**
 * The Office screen (RF-FIN-01..05, RF-HQ-01..03): every tab renders, from a
 * fresh career and from a version-1 save without the new fields (RNF-06), and
 * an HQ upgrade and a sponsor signature go through `act`.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createCareer, createContext } from "../engine/career";
import { postTransaction } from "../engine/finance";
import { ManagerContext } from "./context";
import Office from "./Office";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => ["./Ferrari.svg", "./McLaren.png"];
  return { sourceTictactoeImages: resolve };
});

const context = createContext(fallbackBootstrap, reference);

const mount = (career) => {
  const act = (fn) => fn(career);
  return render(
    <ManagerContext.Provider value={{ career, act, version: 0 }}>
      <Office />
    </ManagerContext.Provider>,
  );
};

const tab = (name) => fireEvent.click(screen.getByRole("radio", { name }));

describe("Office", () => {
  it("renders every tab for an old save and books an upgrade and a sponsor", () => {
    const career = createCareer(context, { year: 2024, teamId: "williams", seed: "office1" });
    delete career.hq;
    // Money in through the books, so the audit stays square.
    postTransaction(career, { amount: 400e6, category: "other", kind: "investment" });
    mount(career);
    expect(screen.getByText(/confidence|confianza/i)).toBeInTheDocument();
    tab(/budget|presupuesto/i);
    expect(screen.getAllByText(/cost cap|techo de gasto/i).length).toBeGreaterThan(0);
    tab(/transactions|movimientos/i);
    expect(screen.getByText(/books balance|cuentas cuadradas/i)).toBeInTheDocument();
    tab(/facilities|instalaciones/i);
    const upgrade = screen.getAllByRole("button", { name: /upgrade to|mejorar a/i })[0];
    fireEvent.click(upgrade);
    expect(career.hq.log[0].kind).toBe("upgrade-start");
    tab(/sponsors|patrocinio/i);
    const before = career.finances.sponsors.length;
    fireEvent.click(screen.getAllByRole("button", { name: /^sign$|^firmar$/i })[0]);
    expect(career.finances.sponsors.length).toBe(before + 1);
  });

  it("shows a free budget before the cost cap existed", () => {
    const career = createCareer(context, { year: 2008, teamId: "williams", seed: "office2" });
    mount(career);
    tab(/budget|presupuesto/i);
    expect(screen.getAllByText(/no cost cap|sin techo de gasto/i).length).toBeGreaterThan(0);
  });
});
