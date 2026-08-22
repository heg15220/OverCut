/**
 * The market and the negotiating table.
 *
 * Two screens that are really one decision: which seat, and what you can get out
 * of it. The offers screen ranks teams by the only thing that decides a season -
 * how fast their car is - and says out loud what each will consider a good year,
 * so signing for the front of the grid is visibly a bet as well as a reward.
 *
 * The negotiation screen shows the real odds before you ask. Hiding them would
 * make the tone choice a guess; showing them makes it a decision.
 */

import React, { useMemo, useState } from "react";
import { CarRankBar, Meter, TeamLogo } from "../atoms";
import { ASKS, TONE, askOdds, isAskAvailable, leverageOf } from "../../engine/contract";
import { ASK_ICONS } from "../icons";
import { t } from "../../i18n";

export const OffersPhase = ({ career, world, onSelect }) => {
  const rookie = career.history.length === 0;
  const teamCount = world.teams.length;

  return (
    <section className="tr-phase tr-market">
      <header className="tr-phase__head">
        <h2 className="tr-phase__title">{t.marketTitle}</h2>
        <p className="tr-phase__lead">{rookie ? t.marketLeadRookie : t.marketLead}</p>
      </header>

      {career.fired && <p className="tr-alert tr-alert--bad">{t.fired}</p>}

      <ul className="tr-offers">
        {career.offers.map((offer) => {
          const rank = world.teams.findIndex((team) => team.id === offer.teamId) + 1;
          return (
            <li key={offer.teamId}>
              <button type="button" className="tr-offer" onClick={() => onSelect(offer.teamId)}>
                <span className="tr-offer__head">
                  <TeamLogo teamName={offer.teamName} size={40} />
                  <span className="tr-offer__name">{offer.teamName}</span>
                  {offer.renewal && <span className="tr-tag">{t.renewalTag}</span>}
                  {offer.lastResort && <span className="tr-tag tr-tag--warn">{t.lastResortTag}</span>}
                </span>

                <CarRankBar rank={rank} total={teamCount} label={t.carRank} />

                <span className="tr-offer__terms">
                  <span>
                    <em>{t.salary}</em>
                    {offer.salary}
                    {t.million}
                  </span>
                  <span>
                    <em>{t.duration}</em>
                    {t.years(offer.years)}
                  </span>
                  <span>
                    <em>{t.seatStatus}</em>
                    {t.status[offer.status]}
                  </span>
                </span>

                <span className="tr-offer__objective">
                  <em>{t.objective}</em>
                  {t.objectives[offer.objective]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const ASK_LIST = [ASKS.SALARY, ASKS.LENGTH, ASKS.SHORTEN, ASKS.LEAD_STATUS, ASKS.RELEASE_CLAUSE, ASKS.DEVELOPMENT];
const TONE_LIST = [TONE.HUMBLE, TONE.FIRM, TONE.BOLD];

export const NegotiationPhase = ({ career, onAsk, onSign, onBack }) => {
  const offer = career.selectedOffer;
  const [tone, setTone] = useState(TONE.FIRM);

  const leverage = useMemo(
    () => leverageOf({ career, offerCount: career.offers.length }),
    [career],
  );

  if (!offer) return null;

  const spent = (offer.grantedAsks?.length || 0) + (offer.refusedAsks?.length || 0);
  const asksLeft = Math.max(0, 3 - spent);

  return (
    <section className="tr-phase tr-negotiation">
      <header className="tr-phase__head">
        <h2 className="tr-phase__title">{t.negotiationTitle}</h2>
        <p className="tr-phase__lead">{t.negotiationLead}</p>
      </header>

      <div className="tr-sheet">
        <div className="tr-sheet__head">
          <TeamLogo teamName={offer.teamName} size={46} />
          <div>
            <strong>{offer.teamName}</strong>
            <span>{t.objectives[offer.objective]}</span>
          </div>
        </div>

        <dl className="tr-terms">
          <div>
            <dt>{t.salary}</dt>
            <dd>
              {offer.salary}
              {t.million}
            </dd>
          </div>
          <div>
            <dt>{t.duration}</dt>
            <dd>{t.years(offer.years)}</dd>
          </div>
          <div>
            <dt>{t.seatStatus}</dt>
            <dd>{t.status[offer.status]}</dd>
          </div>
        </dl>

        <Meter value={offer.trust} label={t.trustLabel} caption={`${Math.round(offer.trust)}`} />

        {career.lastAsk && (
          <p className={`tr-alert${career.lastAsk.won ? " tr-alert--good" : " tr-alert--bad"}`}>
            {t.asks[career.lastAsk.ask]} · {career.lastAsk.won ? t.askGranted : t.askRefused}
          </p>
        )}
      </div>

      <div className="tr-field">
        <span className="tr-label">{t.toneLabel}</span>
        <div className="tr-chiprow">
          {TONE_LIST.map((entry) => (
            <button
              type="button"
              key={entry}
              className={`tr-chip${tone === entry ? " is-on" : ""}`}
              onClick={() => setTone(entry)}
              aria-pressed={tone === entry}
            >
              {t.tones[entry]}
              {/* What you stand to lose if it goes wrong, which is the whole
                  trade the tone makes. The hint under the row says it in words. */}
              <span className="tr-chip__risk" aria-hidden="true">
                {TONE_LIST.map((step, index) => (
                  <i key={step} className={index <= TONE_LIST.indexOf(entry) ? "is-lit" : ""} />
                ))}
              </span>
            </button>
          ))}
        </div>
        <p className="tr-hint">{t.toneHint[tone]}</p>
      </div>

      <div className="tr-field">
        <span className="tr-label">{t.askLabel}</span>
        <div className="tr-cards tr-cards--asks">
          {ASK_LIST.map((ask) => {
            const granted = offer.grantedAsks?.includes(ask);
            const refused = offer.refusedAsks?.includes(ask);
            // An ask can be off the table without having been made: you cannot
            // shorten a one-year deal, and settling the length closes both ways.
            const available = isAskAvailable({ offer, ask });
            const odds = available ? askOdds({ offer, ask, tone, leverage }) : 0;
            const Icon = ASK_ICONS[ask];

            return (
              <button
                type="button"
                key={ask}
                className={`tr-optioncard tr-optioncard--ask${available ? "" : " is-shut"}`}
                disabled={!available || asksLeft === 0}
                onClick={() => onAsk({ ask, tone })}
              >
                <strong>
                  {Icon && <Icon />}
                  {t.asks[ask]}
                </strong>
                <span>
                  {granted
                    ? t.askGranted
                    : refused
                      ? t.askRefused
                      : available
                        ? t.odds(odds)
                        : t.askUnavailable}
                </span>
                {/* Six percentages in a column are hard to compare at a glance;
                    six bars are not. The number stays for the reader who wants it. */}
                <span className="tr-odds" data-testid="odds-bar" aria-hidden="true">
                  <span className="tr-odds__fill" style={{ width: `${(odds * 100).toFixed(1)}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tr-actions">
        <button type="button" className="tr-ghost" onClick={onBack}>
          {t.backToOffers}
        </button>
        <button type="button" className="tr-cta" onClick={onSign}>
          {t.signContract}
        </button>
      </div>
    </section>
  );
};

/**
 * Somebody paid to take you away.
 *
 * The only screen in the game where staying is an active choice: the terms of
 * the seat you are being offered sit next to what you still owe the team you
 * are in, because that is the trade - a faster car now against a deal you gave
 * your word on.
 */
export const ClausePhase = ({ career, world, onAccept, onReject }) => {
  const offer = career.clauseOffer;
  if (!offer) return null;

  const rank = world.teams.findIndex((team) => team.id === offer.teamId) + 1;

  return (
    <section className="tr-phase tr-clause">
      <header className="tr-phase__head">
        <h2 className="tr-phase__title">{t.clauseTitle}</h2>
        <p className="tr-phase__lead">{t.clauseLead(offer.teamName, career.contract.teamName)}</p>
      </header>

      <div className="tr-sheet">
        <div className="tr-sheet__head">
          <TeamLogo teamName={offer.teamName} size={46} />
          <div>
            <strong>{offer.teamName}</strong>
            <span>{t.objectives[offer.objective]}</span>
          </div>
        </div>

        <CarRankBar rank={rank} total={world.teams.length} label={t.carRank} />

        <dl className="tr-terms">
          <div>
            <dt>{t.clausePaidLabel}</dt>
            <dd>
              {offer.clausePaid}
              {t.million}
            </dd>
          </div>
          <div>
            <dt>{t.salary}</dt>
            <dd>
              {offer.salary}
              {t.million}
            </dd>
          </div>
          <div>
            <dt>{t.duration}</dt>
            <dd>{t.years(offer.years)}</dd>
          </div>
          <div>
            <dt>{t.seatStatus}</dt>
            <dd>{t.status[offer.status]}</dd>
          </div>
        </dl>

        <p className="tr-hint">{t.clauseStayHint(career.contract.teamName, career.contract.yearsRemaining)}</p>
      </div>

      <div className="tr-actions">
        <button type="button" className="tr-ghost" onClick={onReject}>
          {t.clauseReject}
        </button>
        <button type="button" className="tr-cta" onClick={onAccept}>
          {t.clauseAccept}
        </button>
      </div>
    </section>
  );
};
