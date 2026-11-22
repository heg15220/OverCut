/** Messages, and the decisions some of them are waiting for. */

import React, { useState } from "react";
import { markAllRead, markRead } from "../engine/inbox";
import { resolveEvent } from "../engine/events";
import { useManager } from "./context";
import { Empty, Panel, Pill } from "./atoms";
import { eventOutcome, eventText, inboxBody, inboxTitle, t } from "./texts";

export function EventChoices({ item, onDone }) {
  const { career, act } = useManager();
  const text = eventText(career, item.event);
  if (item.event.resolved) {
    return <p className="mn-outcome">{eventOutcome(item.event)}</p>;
  }
  return (
    <div className="mn-choices">
      {item.event.options.map((option) => (
        <button
          type="button"
          key={option}
          className="mn-btn"
          onClick={() => {
            act((c) => resolveEvent(c, item.id, option));
            onDone?.();
          }}
        >
          {text.options[option] || option}
        </button>
      ))}
    </div>
  );
}

export default function Inbox() {
  const { career, act } = useManager();
  const [openId, setOpenId] = useState(career.inbox[0]?.id || null);
  const open = career.inbox.find((item) => item.id === openId) || null;
  return (
    <div className="mn-grid mn-grid--inbox">
      <Panel
        title={t("Bandeja de entrada", "Inbox")}
        action={
          <button type="button" className="mn-link" onClick={() => act((c) => markAllRead(c))}>
            {t("Marcar todo como leído", "Mark all as read")}
          </button>
        }
      >
        {career.inbox.length ? (
          <ul className="mn-inbox">
            {career.inbox.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${item.read ? "" : "is-unread"}${item.id === openId ? " is-open" : ""}`}
                  onClick={() => {
                    setOpenId(item.id);
                    act((c) => markRead(c, item.id));
                  }}
                >
                  <small>
                    {item.year} · R{Math.min(item.round + 1, career.world.races.length)}
                  </small>
                  <span>{inboxTitle(career, item)}</span>
                  {item.kind === "event" && !item.event.resolved && <Pill tone="gold">{t("Decidir", "Decide")}</Pill>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{t("Nada por aquí.", "Nothing here.")}</Empty>
        )}
      </Panel>
      <Panel title={open ? inboxTitle(career, open) : t("Mensaje", "Message")} className="mn-message">
        {open ? (
          <>
            <p>{inboxBody(career, open)}</p>
            {open.kind === "event" && <EventChoices item={open} />}
          </>
        ) : (
          <Empty>{t("Elige un mensaje.", "Pick a message.")}</Empty>
        )}
      </Panel>
    </div>
  );
}
