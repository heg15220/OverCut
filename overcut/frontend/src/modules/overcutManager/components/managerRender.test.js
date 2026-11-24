/**
 * Render tests for the manager screens.
 *
 * The engine has its own tests; these check that the whole flow mounts and the
 * clicks a player makes on day one work: a new career with a real team, a race
 * weekend from Friday to the flag, and a team built from scratch joining the
 * grid. `fetch` fails, so the component takes the offline path.
 */

import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OvercutManager from "./OvercutManager";
import CareerModeHome from "../../careerMode/components/CareerModeHome";

jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => ["./Ferrari.svg", "./McLaren.png"];
  return { sourceTictactoeImages: resolve };
});

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.reject(new Error("offline")));
  window.localStorage.clear();
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

const renderGame = () =>
  render(
    <MemoryRouter>
      <OvercutManager />
    </MemoryRouter>,
  );

const startWizard = async () => {
  renderGame();
  fireEvent.click(await screen.findByRole("button", { name: /new career/i }));
  // Season (the latest offline one) -> mode.
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
};

describe("OvercutManager", () => {
  it("is offered from the Career Mode door", () => {
    render(
      <MemoryRouter>
        <CareerModeHome />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /start manager mode/i })).toHaveAttribute("href", "/careerMode/manager");
  });

  it("starts a career with a real team and plays a weekend", async () => {
    await startWizard();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /^ferrari/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "Mattia" } });
    fireEvent.click(screen.getByRole("button", { name: /sign the contract/i }));

    expect(await screen.findByRole("button", { name: /let's get to work/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /let's get to work/i }));
    expect(screen.getByTestId("manager-root")).toHaveTextContent("Ferrari");

    // Every section mounts.
    ["Inbox", "Drivers", "Car & R&D", "Market", "Staff", "Standings", "Calendar", "Office", "Home"].forEach((label) => {
      fireEvent.click(within(screen.getByRole("navigation", { name: /sections/i })).getByRole("button", { name: new RegExp(label.replace(/[&]/g, "\\&"), "i") }));
    });

    // Commission a part.
    fireEvent.click(within(screen.getByRole("navigation", { name: /sections/i })).getByRole("button", { name: /car & r&d/i }));
    fireEvent.click(screen.getByRole("button", { name: /commission/i }));
    expect(screen.getByText(/in the factory/i)).toBeInTheDocument();

    // The weekend: practice, qualifying, a simulated race, the result.
    fireEvent.click(within(screen.getByRole("navigation", { name: /sections/i })).getByRole("button", { name: /home/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /go to the/i })[0]);
    // WKD-1 (RF-WKD-02): each session opens at its gate - manage it, simulate it or go up to the race.
    expect(await screen.findByRole("radio", { name: /simulate up to the race/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    // RF-WKD-03: practice is played - every driver of yours has a run plan and "Go out".
    expect(await screen.findAllByRole("button", { name: /^go out$/i })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /skip practice/i }));
    // RF-WKD-07: the session's results (a skipped practice has no timing), then the next gate.
    expect(screen.getAllByText(/practice results/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    // Qualifying live or in one go.
    expect(screen.getByRole("button", { name: /qualifying live/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText(/simulate it in one go/i));
    fireEvent.click(screen.getByRole("button", { name: /simulate qualifying/i }));
    expect(screen.getAllByText(/qualifying results/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^pole$/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getAllByText(/starting grid/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /simulate the race/i }));
    expect(screen.getByText(/chequered flag/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.queryByText(/chequered flag/i)).not.toBeInTheDocument();
  }, 30000);

  it("runs the race live from the pit wall", async () => {
    await startWizard();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /^mclaren/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "Zak" } });
    fireEvent.click(screen.getByRole("button", { name: /sign the contract/i }));
    fireEvent.click(await screen.findByRole("button", { name: /let's get to work/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /go to the/i })[0]);
    // WKD-1: simulate everything up to Sunday's strategy from the first gate.
    fireEvent.click(await screen.findByRole("radio", { name: /simulate up to the race/i }));
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    fireEvent.click(screen.getByRole("button", { name: /run the race/i }));
    expect(screen.getByRole("list", { name: /timing tower/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /one lap/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /box for hard/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /to the flag/i }));
    expect(screen.getAllByText(/chequered flag/i).length).toBeGreaterThan(0);
  });

  it("builds a team from scratch and adds it to the grid", async () => {
    await startWizard();
    fireEvent.click(screen.getByRole("button", { name: /create my own team/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText("OverCut Racing"), { target: { value: "Seam Racing" } });
    fireEvent.click(screen.getByRole("button", { name: /garagiste/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    const rows = screen.getAllByRole("button").filter((element) => element.classList.contains("mn-su-driver"));
    fireEvent.click(rows[0]);
    fireEvent.click(rows[1]);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "Owner" } });
    fireEvent.click(screen.getByRole("button", { name: /enter the team/i }));
    expect(await screen.findByRole("dialog", { name: "Seam Racing" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /let's get to work/i }));
    fireEvent.click(within(screen.getByRole("navigation", { name: /sections/i })).getByRole("button", { name: /standings/i }));
    fireEvent.click(screen.getByRole("tab", { name: /constructors/i }));
    expect(screen.getAllByText("Seam Racing").length).toBeGreaterThan(0);
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("overcutManagerSave.v1") || "null")).toBeTruthy());
  });

  // RF-CAR-05: the game mode picked in the wizard is the mode of the career it creates.
  it("passes the chosen game mode to the new career", async () => {
    await startWizard();
    expect(screen.getByRole("button", { name: /strict history/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /^free/i }));
    expect(screen.getByRole("button", { name: /^free/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /^ferrari/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Free", { selector: "dd" })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "Fred" } });
    fireEvent.click(screen.getByRole("button", { name: /sign the contract/i }));
    expect(await screen.findByRole("dialog", { name: "Ferrari" })).toHaveTextContent(/free/i);
    fireEvent.click(screen.getByRole("button", { name: /let's get to work/i }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("overcutManagerSave.v1") || "null")?.career?.mode).toBe("free"));
  });

  it("keeps strict history as the default mode", async () => {
    await startWizard();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /^mclaren/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "Zak" } });
    fireEvent.click(screen.getByRole("button", { name: /sign the contract/i }));
    fireEvent.click(await screen.findByRole("button", { name: /let's get to work/i }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("overcutManagerSave.v1") || "null")?.career?.mode).toBe("strict"));
  });
});
