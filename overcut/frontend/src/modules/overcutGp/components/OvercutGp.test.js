import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OvercutGp, { GAME_SRC } from "./OvercutGp";

const respondWith = (body) => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(body) }));
};

const renderPage = () => render(
  <MemoryRouter>
    <OvercutGp />
  </MemoryRouter>
);

afterEach(() => {
  delete global.fetch;
});

test("loads the Godot web build in a frame when it is there", async () => {
  respondWith("<html><script src='index.js'></script><script>new Engine(GODOT_CONFIG)</script></html>");
  renderPage();
  const frame = await screen.findByTitle("OverCut GP");
  expect(frame.tagName).toBe("IFRAME");
  expect(frame.getAttribute("src")).toBe(GAME_SRC);
  expect(global.fetch).toHaveBeenCalledWith(GAME_SRC, expect.anything());
});

test("explains how to build the game when the export is missing", async () => {
  // The dev server answers unknown paths with the React app's own index.html.
  respondWith("<html><div id='root'></div></html>");
  renderPage();
  expect(await screen.findByText(/export_web\.sh/)).toBeInTheDocument();
  expect(screen.queryByTitle("OverCut GP")).not.toBeInTheDocument();
});

test("always offers a way back to OverCut", () => {
  respondWith("");
  renderPage();
  expect(screen.getByRole("link", { name: /OverCut/ })).toHaveAttribute("href", "/");
});
