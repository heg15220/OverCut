/**
 * One decision away from the track.
 *
 * Deliberately plain: a title, a paragraph, and the options. The consequences are
 * not previewed, because an event whose outcome you can read off the button is
 * not a decision - and because the point of these is that you find out years
 * later, when the market remembers.
 */

import React from "react";
import { EVENT_ICONS } from "../icons";
import { t } from "../../i18n";

export const EventPhase = ({ event, onChoose }) => {
  if (!event) return null;

  // What kind of decision this is - not what it costs. The consequences stay
  // hidden on purpose; an event you can read off the button is not a decision.
  const Category = EVENT_ICONS[event.category];

  return (
    <section className="tr-phase tr-event">
      <header className="tr-phase__head">
        <span className="tr-eyebrow">
          {t.eventTitle}
          {Category && (
            <span className="tr-eyebrow__tag">
              <Category />
              {t.eventCategories[event.category]}
            </span>
          )}
        </span>
        <h2 className="tr-phase__title">{event.title}</h2>
      </header>

      <p className="tr-event__body">{event.body}</p>

      <div className="tr-cards tr-cards--stack">
        {event.options.map((option) => (
          <button
            type="button"
            key={option.id}
            className="tr-optioncard tr-optioncard--choice"
            onClick={() => onChoose(option.id)}
          >
            <strong>{option.label}</strong>
          </button>
        ))}
      </div>
    </section>
  );
};

export default EventPhase;
