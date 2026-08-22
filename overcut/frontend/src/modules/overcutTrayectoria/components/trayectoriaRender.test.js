/**
 * Render smoke tests.
 *
 * The engine has its own tests; these only check that the screens mount, that
 * the pieces the engine hands them survive the trip into JSX, and that the one
 * interaction that would be embarrassing to break - creating a driver - works.
 *
 * `fetch` is stubbed to fail so the component takes the offline path, which is
 * the same path a user on a broken connection gets.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OvercutTrayectoria from "./OvercutTrayectoria";
import { SeasonStrip } from "./SeasonStrip";
import { ClausePhase, NegotiationPhase } from "./phases/MarketPhase";
import PreseasonPhase from "./phases/PreseasonPhase";
import SeasonPhase from "./phases/SeasonPhase";
import EventPhase from "./phases/EventPhase";
import RetiredPhase from "./phases/RetiredPhase";
import { fallbackBootstrap } from "../data/fallbackBootstrap";
import { buildSeasonWorld, prepareBootstrap } from "../engine/world";
import { createDriverAttributes } from "../engine/attributes";
import { simulateSeason } from "../engine/season";
import { t } from "../i18n";

// The team-badge helper is built on webpack's `require.context`, which does not
// exist under Jest. Standing in for it keeps these tests about the screens.
jest.mock("../../../helpers/sourceTictactoeImages", () => {
  const resolve = () => "logo.png";
  resolve.keys = () => ["./Ferrari.svg", "./McLaren.png"];
  return { sourceTictactoeImages: resolve };
});

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.reject(new Error("offline")));
});

afterEach(() => {
  jest.resetAllMocks();
});

const renderGame = () =>
  render(
    <MemoryRouter>
      <OvercutTrayectoria />
    </MemoryRouter>,
  );

describe("OvercutTrayectoria", () => {
  it("falls back to the bundled data when the endpoint is unreachable", async () => {
    renderGame();
    expect(await screen.findByText(t.dataOffline)).toBeInTheDocument();
    expect(screen.getByText(t.setupTitle)).toBeInTheDocument();
  });

  it("will not start a career without a driver name", async () => {
    renderGame();
    const start = await screen.findByRole("button", { name: t.startCareer });
    expect(start).toBeDisabled();
  });

  it("creates a driver and opens the market", async () => {
    renderGame();

    const input = await screen.findByLabelText(t.nameLabel);
    fireEvent.change(input, { target: { value: "Ana Ferrer" } });
    fireEvent.click(screen.getByRole("button", { name: t.startCareer }));

    expect(await screen.findByText(t.marketTitle)).toBeInTheDocument();
    // The market always has something, even if it is the worst car on the grid.
    expect(screen.getAllByText(t.objective).length).toBeGreaterThan(0);
    expect(screen.getByText("Ana Ferrer")).toBeInTheDocument();
  });
});

describe("SeasonStrip", () => {
  const bootstrap = prepareBootstrap(fallbackBootstrap, { fallbackMode: true });
  const world = buildSeasonWorld({ bootstrap, year: 2016, seed: "render" });
  const season = simulateSeason({
    world,
    player: {
      name: "Strip Driver",
      age: 21,
      attributes: createDriverAttributes({ seed: "strip", talent: 80 }),
    },
    teamId: world.teams[2].id,
    focus: "consistency",
    seed: "render",
  });

  // Every cell carries the Grand Prix name as its title, in either language.
  const cells = () => screen.getAllByTitle(/GP/);

  it("draws one cell per Grand Prix", () => {
    render(<SeasonStrip races={season.races} />);
    expect(cells()).toHaveLength(season.races.length);
  });

  it("only fills the cells that have been revealed", () => {
    render(<SeasonStrip races={season.races} revealed={4} />);
    const filled = cells().filter((cell) => cell.textContent.trim() !== "");
    expect(filled.length).toBeLessThanOrEqual(4);
  });
});

describe("the clause screen", () => {
  const world = {
    teams: [
      { id: "ferrari", name: "Ferrari", carRating: 88 },
      { id: "williams", name: "Williams", carRating: 82 },
      { id: "minardi", name: "Minardi", carRating: 70 },
    ],
  };

  const career = {
    year: 1989,
    contract: { teamId: "minardi", teamName: "Minardi", yearsRemaining: 2, clauseValue: 24.5 },
    clauseOffer: {
      teamId: "ferrari",
      teamName: "Ferrari",
      carRating: 88,
      salary: 12,
      years: 3,
      status: "lead",
      objective: "title",
      clausePaid: 24.5,
      leavingTeamName: "Minardi",
      trust: 50,
    },
  };

  it("says who paid, what it cost them, and what is on the table", () => {
    render(<ClausePhase career={career} world={world} onAccept={() => {}} onReject={() => {}} />);

    expect(screen.getAllByText(/Ferrari/).length).toBeGreaterThan(0);
    expect(screen.getByText(/24[.,]5/)).toBeInTheDocument();
    expect(screen.getByText(t.objectives.title)).toBeInTheDocument();
  });

  it("lets the driver leave or stay", () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    render(<ClausePhase career={career} world={world} onAccept={onAccept} onReject={onReject} />);

    fireEvent.click(screen.getByRole("button", { name: t.clauseAccept }));
    expect(onAccept).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: t.clauseReject }));
    expect(onReject).toHaveBeenCalled();
  });
});

describe("asking for a shorter deal", () => {
  const negotiating = (years) => ({
    offers: [],
    history: [],
    driver: { age: 26, attributes: { talent: 80 } },
    selectedOffer: {
      teamId: "ferrari",
      teamName: "Ferrari",
      salary: 10,
      years,
      status: "equal",
      objective: "podiums",
      trust: 50,
      grantedAsks: [],
      refusedAsks: [],
    },
  });

  it("offers to give a season back", () => {
    render(<NegotiationPhase career={negotiating(3)} onAsk={() => {}} onSign={() => {}} onBack={() => {}} />);
    expect(screen.getByText(t.asks.shorten)).toBeInTheDocument();
  });

  it("will not let you shorten a one-season deal", () => {
    render(<NegotiationPhase career={negotiating(1)} onAsk={() => {}} onSign={() => {}} onBack={() => {}} />);
    expect(screen.getByRole("button", { name: new RegExp(t.asks.shorten) })).toBeDisabled();
  });
});

describe("the winter in the factory", () => {
  const world = {
    generated: false,
    races: [{ round: 1, name: "Brazilian Grand Prix", country: "br" }],
    teams: [{ id: "ferrari", name: "Ferrari", carRating: 90 }],
  };

  const wintering = (over = {}) => ({
    year: 1990,
    yearsAtTeam: 2,
    history: [{ year: 1989 }],
    focus: "technical",
    contract: { teamId: "ferrari", teamName: "Ferrari", objective: "podiums", status: "lead" },
    objective: { met: true, beatTeammate: true },
    driver: { name: "Driver", attributes: { technical: 60 } },
    lastSeason: {
      player: { carRank: 3 },
      constructorStandings: [{ teamId: "ferrari", position: 2 }],
    },
    ...over,
  });

  it("says what the odds are before the winter is spent", () => {
    render(<PreseasonPhase career={wintering()} world={world} onFocus={() => {}} onRun={() => {}} />);

    const card = screen.getByRole("button", { name: new RegExp(t.focus.technical) });
    expect(card).toHaveTextContent(/%/);
  });

  it("says why there are no odds in a first year at a team", () => {
    render(
      <PreseasonPhase career={wintering({ yearsAtTeam: 1 })} world={world} onFocus={() => {}} onRun={() => {}} />,
    );

    expect(screen.getByText(t.upgradeLocked)).toBeInTheDocument();
  });
});

describe("telling the player how the winter went", () => {
  const seasonWith = () => {
    const built = buildSeasonWorld({
      bootstrap: prepareBootstrap(fallbackBootstrap, { fallbackMode: true }),
      year: 1988,
      seed: "winter",
    });
    return simulateSeason({
      world: built,
      player: { name: "Driver", age: 26, attributes: createDriverAttributes({ seed: "winter", talent: 80 }) },
      teamId: built.teams[2].id,
      focus: "technical",
      seed: "winter",
    });
  };

  const careerWith = (upgrade) => ({
    year: 1988,
    history: [],
    driver: { name: "Driver" },
    contract: { teamName: "Ferrari" },
    lastSeason: seasonWith(),
    upgrade,
  });

  it("says what the upgrade was worth rather than that the car is better than last year", () => {
    render(<SeasonPhase career={careerWith({ granted: true, chance: 0.4, gain: 0.03 })} onContinue={() => {}} />);
    const announcement = screen.getByText(t.upgradeGranted("Ferrari", 3));
    expect(announcement).toBeInTheDocument();
    // It has to name the size of the step; "a better car" is the claim that was wrong.
    expect(announcement).toHaveTextContent(/3\s?%/);
  });

  it("puts the car's place on the grid next to it, so a step forward in a worse car reads honestly", () => {
    // The gain is measured against the car the team would otherwise have built,
    // and a season's natural swing is more than twice as big - so a real upgrade
    // can still arrive in a car that is further down the grid than last year's.
    const career = {
      ...careerWith({ granted: true, chance: 0.4, gain: 0.03 }),
      history: [
        { year: 1987, teamId: "ferrari", carRank: 1 },
        { year: 1988, teamId: "ferrari", carRank: 5 },
      ],
    };
    render(<SeasonPhase career={career} onContinue={() => {}} />);

    // The standing sits in the same paragraph as the announcement, so the whole
    // alert is what has to carry both halves of the truth.
    const announcement = screen.getByText(new RegExp(t.upgradeGranted("Ferrari", 3).slice(0, 30)));
    expect(announcement).toHaveTextContent(t.upgradeCarStanding(5, 1));
  });

  it("says plainly when the winter came to nothing", () => {
    render(<SeasonPhase career={careerWith({ granted: false, chance: 0.4, gain: 0 })} onContinue={() => {}} />);
    expect(screen.getByText(t.upgradeMissed)).toBeInTheDocument();
  });

  it("says nothing at all about a winter spent elsewhere", () => {
    render(<SeasonPhase career={careerWith({ granted: false, chance: 0, gain: 0 })} onContinue={() => {}} />);
    expect(screen.queryByText(t.upgradeMissed)).not.toBeInTheDocument();
  });
});

describe("reading a season at a glance", () => {
  // The screen reveals race by race; reduced motion takes it straight to the
  // finished state, which is where the tables and the duel live.
  beforeEach(() => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  });

  const world = buildSeasonWorld({
    bootstrap: prepareBootstrap(fallbackBootstrap, { fallbackMode: true }),
    year: 2008,
    seed: "glance",
  });

  const season = simulateSeason({
    world,
    player: { name: "Driver", age: 26, attributes: createDriverAttributes({ seed: "glance", talent: 80 }) },
    teamId: world.teams[4].id,
    focus: "consistency",
    seed: "glance",
  });

  const career = {
    year: 2008,
    driver: { name: "Driver" },
    contract: { teamName: season.player.team },
    history: [],
    lastSeason: season,
    upgrade: null,
  };

  const show = () => render(<SeasonPhase career={career} onContinue={() => {}} />);

  // The eight the season screen shows; `t.stats` also carries labels other
  // screens use.
  const SHOWN = ["position", "starts", "wins", "podiums", "points", "poles", "fastestLaps", "retirements"];

  it("keeps every stat readable as a number with its name", () => {
    show();
    SHOWN.forEach((stat) => {
      expect(screen.getByText(t.stats[stat])).toBeInTheDocument();
    });
  });

  it("gives every stat a glyph of its own", () => {
    show();
    SHOWN.forEach((stat) => {
      expect(screen.getByTestId(`stat-icon-${stat}`)).toBeInTheDocument();
    });
  });

  it("announces the duel with both scores in it", () => {
    show();
    const bar = screen.getByRole("img", { name: new RegExp(String(Math.round(season.player.points))) });
    expect(bar).toHaveAccessibleName(new RegExp(String(Math.round(season.teammate.points))));
  });

  it("splits the duel bar by the points each driver scored", () => {
    show();
    const mine = Math.round(season.player.points);
    const theirs = Math.round(season.teammate.points);
    const share = (mine / (mine + theirs)) * 100;

    expect(screen.getByTestId("duel-share")).toHaveStyle({ width: `${share.toFixed(1)}%` });
  });

  it("puts a badge next to every driver's team in the championship", () => {
    show();
    expect(screen.getAllByTestId("standings-badge").length).toBe(
      Math.min(10, season.standings.length),
    );
  });
});

describe("symbols on the decision screens", () => {
  const ASKS_SHOWN = ["salary", "length", "shorten", "leadStatus", "releaseClause", "development"];
  const FOCUS_SHOWN = ["qualifying", "racecraft", "consistency", "technical"];

  const negotiating = (over = {}) => ({
    offers: [],
    history: [],
    driver: { age: 26, attributes: { talent: 80 } },
    selectedOffer: {
      teamId: "williams",
      teamName: "Williams",
      salary: 10,
      years: 3,
      status: "equal",
      objective: "points",
      trust: 50,
      grantedAsks: [],
      refusedAsks: [],
      ...over,
    },
  });

  const preseason = (over = {}) => ({
    year: 1990,
    yearsAtTeam: 2,
    history: [{ year: 1989 }],
    focus: "technical",
    contract: { teamId: "williams", teamName: "Williams", objective: "points", status: "equal" },
    objective: { met: true, beatTeammate: true },
    driver: { name: "Driver", attributes: { technical: 60 } },
    lastSeason: { player: { carRank: 3 }, constructorStandings: [{ teamId: "williams", position: 2 }] },
    ...over,
  });

  const world = { generated: false, races: [{ round: 1, name: "Brazilian Grand Prix", country: "br" }], teams: [] };

  it("gives every ask on the table a symbol", () => {
    render(<NegotiationPhase career={negotiating()} onAsk={() => {}} onSign={() => {}} onBack={() => {}} />);
    ASKS_SHOWN.forEach((ask) => {
      expect(screen.getByTestId(`ask-icon-${ask}`)).toBeInTheDocument();
    });
  });

  it("draws the odds as well as printing them", () => {
    render(<NegotiationPhase career={negotiating()} onAsk={() => {}} onSign={() => {}} onBack={() => {}} />);
    // Six numbers in a column are hard to compare; six bars are not.
    expect(screen.getAllByTestId("odds-bar").length).toBe(ASKS_SHOWN.length);
  });

  it("gives every winter a symbol", () => {
    render(<PreseasonPhase career={preseason()} world={world} onFocus={() => {}} onRun={() => {}} />);
    FOCUS_SHOWN.forEach((focus) => {
      expect(screen.getByTestId(`focus-icon-${focus}`)).toBeInTheDocument();
    });
  });

  it("marks the factory as locked rather than unlikely", () => {
    render(
      <PreseasonPhase career={preseason({ yearsAtTeam: 1 })} world={world} onFocus={() => {}} onRun={() => {}} />,
    );
    expect(screen.getByTestId("focus-locked")).toBeInTheDocument();
  });

  it("says what kind of decision an off-track event is", () => {
    const event = {
      id: "young-teammate",
      category: "garage",
      title: "El chico nuevo",
      body: "Tu nuevo compañero tiene 21 años.",
      options: [
        { id: "mentor", label: "Tomarlo bajo tu ala" },
        { id: "block", label: "Cerrarle todas las puertas" },
      ],
    };
    render(<EventPhase event={event} onChoose={() => {}} />);

    expect(screen.getByText(t.eventCategories.garage)).toBeInTheDocument();
    expect(screen.getByTestId("event-icon-garage")).toBeInTheDocument();
  });
});

describe("the moment you win it", () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  });

  const races = Array.from({ length: 18 }, (unused, index) => ({
    round: index + 1,
    name: `Round ${index + 1} Grand Prix`,
    country: "es",
    weather: "dry",
    winner: "Somebody",
    winnerTeam: "Sauber",
    pole: null,
    fastestLap: null,
    podium: [],
    player: {
      grid: 2,
      position: (index % 4) + 1,
      status: "finished",
      points: 12,
      pole: index % 5 === 0,
      fastestLap: false,
    },
  }));

  const champion = {
    year: 2033,
    driver: { name: "ALO" },
    contract: { teamName: "Sauber" },
    history: [],
    upgrade: null,
    lastSeason: {
      year: 2033,
      raceCount: races.length,
      races,
      standings: [{ entrantId: "player", isPlayer: true, driver: "ALO", team: "Sauber", teamId: "sauber", points: 310, position: 1, grossPoints: 310, finishes: 18, retirements: 0 }],
      constructorStandings: [{ teamId: "sauber", team: "Sauber", points: 410, position: 1 }],
      teammate: null,
      player: { champion: true, team: "Sauber", teamId: "sauber", position: 1, points: 310, wins: 8, droppedPoints: 0, starts: 18, carRank: 1 },
    },
  };

  it("replays the season that won it rather than printing a number", () => {
    render(<SeasonPhase career={champion} onContinue={() => {}} />);
    // The strip is the hero: one cell per Grand Prix of the year just raced.
    expect(screen.getAllByTitle(/Grand Prix/).length).toBe(races.length);
  });

  it("names the driver and the year that did it", () => {
    render(<SeasonPhase career={champion} onContinue={() => {}} />);

    expect(screen.getByText(t.worldChampion)).toBeInTheDocument();
    expect(screen.getByText("ALO")).toBeInTheDocument();
    expect(screen.getByText(t.championSubtitle(2033, "Sauber"))).toBeInTheDocument();
  });

  it("counts the wins that came with it", () => {
    render(<SeasonPhase career={champion} onContinue={() => {}} />);
    expect(screen.getByTestId("champion-wins")).toHaveTextContent("5");
  });

  it("hands the season back when you are done with the moment", () => {
    render(<SeasonPhase career={champion} onContinue={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: t.continue }));

    expect(screen.getByText(t.seasonTitle(2033))).toBeInTheDocument();
  });
});

describe("the career, closed", () => {
  const career = {
    debutYear: 2020,
    year: 2044,
    driver: { name: "ALO", helmet: { primary: "#f2b705", secondary: "#0e2a53", style: "solid" } },
    totals: { titles: 4, wins: 45, podiums: 114, poles: 72, fastestLaps: 34, starts: 563, points: 3638, seasons: 24 },
    verdict: { tier: "great", overachiever: true, underachiever: false },
    records: {
      titles: { rank: 4, value: 4, next: { name: "Juan Fangio", value: 5 }, leader: { name: "Juan Fangio", value: 5 } },
      wins: { rank: 6, value: 45, next: { name: "Alain Prost", value: 51 }, leader: { name: "Michael Schumacher", value: 91 } },
      podiums: { rank: 4, value: 114, next: { name: "Sebastian Vettel", value: 122 }, leader: { name: "Lewis Hamilton", value: 197 } },
      seasons: { rank: 1, value: 24, next: null, leader: { name: "ALO", value: 24 } },
    },
    rivalVerdict: {
      rival: { name: "Max Verstappen", startYear: 2020, titles: 8, wins: 68, podiums: 149 },
      headToHead: { player: 0, rival: 10 },
      verdict: "overshadowed",
    },
    history: [
      { year: 2020, team: "Williams", teamId: "williams", position: 16, champion: false },
      { year: 2033, team: "Sauber", teamId: "sauber", position: 1, champion: true },
    ],
  };

  const show = () => render(<RetiredPhase career={career} seasonsByYear={{}} onRestart={() => {}} />);

  it("gives every career total its symbol, titles and seasons included", () => {
    show();
    ["titles", "wins", "podiums", "poles", "fastestLaps", "starts", "points", "seasons"].forEach((stat) => {
      expect(screen.getByTestId(`stat-icon-${stat}`)).toBeInTheDocument();
    });
  });

  it("draws how far the record books still are", () => {
    show();
    // "6th all-time in wins, Prost 51" leaves you doing the arithmetic; a bar
    // against the all-time leader does not.
    expect(screen.getAllByTestId("record-bar").length).toBe(4);
  });

  it("splits the rival the same way it splits a team-mate", () => {
    show();
    // Ten duels to nil: the bar has to be empty on your side.
    expect(screen.getByTestId("rival-share")).toHaveStyle({ width: "0.0%" });
  });

  it("marks the seasons you won on the career sheet", () => {
    show();
    expect(screen.getAllByTestId("careerstrip-badge").length).toBe(career.history.length);
    expect(screen.getByTestId("careerstrip-2033")).toHaveClass("is-champion");
  });
});

describe("where the screen starts", () => {
  it("takes the player to the top of every new screen", async () => {
    // Measured with Playwright before this existed: finishing a negotiation at
    // the bottom of the page dropped you into the middle of the preseason
    // screen, because a phase change only swaps the content under the viewport.
    const scrollTo = jest.fn();
    window.scrollTo = scrollTo;

    renderGame();
    await screen.findByText(t.setupTitle);
    scrollTo.mockClear();

    fireEvent.change(screen.getByLabelText(t.nameLabel), { target: { value: "ALO" } });
    fireEvent.click(screen.getByRole("button", { name: t.startCareer }));

    await screen.findByText(t.marketTitle);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });
});
