/**
 * The pit-stop dialog: HUD-3 of docs/manager/F1M24-GAMEPLAY.md (pit-widget-and-dialog;
 * RF-CMD-02, RF-SIM-12, RF-SIM-13, RNF-07, RNF-08). A Sheet that pauses the session while it is
 * open (hud.json pitDialog.pauseOnOpen, live-view.json pauseOn "pitDialog": the race view holds
 * its clock through useAutoSpeed, so the engine takes no step).
 *
 * What it shows is engine/sim/pitLane.js previewPit (PIT-1, §1.7), which reads the race and
 * changes nothing (RF-SIM-15, RNF-05):
 *   - the compound to fit (the era's compounds, commands.pit), the one on the car with its life
 *     and the one the plan has next; the two-compound rule with its count when the era has it
 *   - the fuel to load in a refuelling era
 *   - the net loss against staying out under green, and under SC / VSC only in eras that have
 *     them, with what it is made of (lane, typical stationary time, double-stack wait) - net
 *     losses, never a line-to-line lane time (F1M24-GAMEPLAY §1.6)
 *   - the estimated position at the exit, the distance to the pit entry, and a warning when the
 *     team-mate stops on the same lap
 * The call goes through `onConfirm(compound, options, preview)` (race.js / stepRace requestPit).
 *
 * GS-15 (HUD-C2, F1M24-CHINA, the menu): it also shows the line-to-line stopwatch previewPit expects (lineToLine,
 * under the SC or VSC out now when the era has it: pitEstimateOf), the same definition as the pit widget's
 * stopwatch (PIT-C1), and hands the preview to the caller so the widget can show the estimate next to what it reads.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Sheet, Tyre } from "./atoms";
import { isWetTyre } from "../engine/race";
import { previewPit } from "../engine/sim/pitLane";
import { COMPOUND, t } from "./texts";

const seconds = (value) => (Number.isFinite(value) ? `${value.toFixed(1)} s` : "—");

/** previewPit, defensively: a race the preview cannot read gives no numbers rather than a crash. */
export const safePreview = (state, carId, options) => {
  try {
    return previewPit(state, carId, options);
  } catch (error) {
    return null;
  }
};

/**
 * GS-15 (HUD-C2, F1M24-CHINA §1.5 «Estimación de la parada»): the stopwatch the stop should read, from previewPit's
 * line-to-line time - under the SC or VSC out now (`neutralised` "sc" | "vsc") when the preview has it, else green.
 * The same definition as the pit widget's stopwatch (PIT-C1). Null without a number.
 */
export const pitEstimateOf = (preview, neutralised = null) => {
  if (!preview) return null;
  if (neutralised === "sc" && preview.scAllowed && Number.isFinite(preview.lineToLineSc)) return { sec: preview.lineToLineSc, kind: "sc" };
  if (neutralised === "vsc" && preview.vscAllowed && Number.isFinite(preview.lineToLineVsc)) return { sec: preview.lineToLineVsc, kind: "vsc" };
  return Number.isFinite(preview.lineToLine) ? { sec: preview.lineToLine, kind: "green" } : null;
};

/**
 * The two-compound rule (RF-SIM-03, race.js finish): how many dry compounds the car has used,
 * how many after this stop, and how many the era asks for (0 = no rule).
 */
export const compoundRuleOf = (rules, car, compound) => {
  const mandatory = rules?.tyres?.mandatoryDryCompounds ?? 0;
  const used = new Set((car.compoundsUsed || []).concat(car.compound ? [car.compound] : []).filter((value) => value && !isWetTyre(value)));
  const before = used.size;
  if (compound && !isWetTyre(compound)) used.add(compound);
  return { mandatory, before, after: used.size };
};

export default function PitDialog({ open, onClose, car, state, rules, commands, circuit, share = null, position = null, tyreLife = null, pitThisLap = false, defaultFuel = 1, maxFuel = 1, onConfirm, onCancelCall, neutralised = null }) {
  const compounds = commands.pit.tyres ? commands.pit.compounds : [];
  const planned = car ? car.plan?.compounds?.[Math.min((car.plan?.compounds?.length ?? 1) - 1, (car.stint ?? 0) + 1)] : null;
  const initial = car?.pitRequest?.compound || (compounds.includes(planned) ? planned : compounds[0]) || car?.compound;
  const [compound, setCompound] = useState(initial);
  const [fuel, setFuel] = useState(defaultFuel);
  const refuel = Boolean(commands.pit.fuel);
  useEffect(() => {
    if (open) {
      setCompound(initial);
      setFuel(car?.pitRequest?.fuel ?? defaultFuel);
    }
    // Only when it opens: the race goes on underneath only while it is closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const preview = useMemo(
    () => (open && car ? safePreview(state, car.id, { circuit, share: Number.isFinite(share) ? share : undefined, tyres: commands.pit.tyres, refuelLaps: refuel ? fuel : undefined }) : null),
    [open, car, state, circuit, share, commands.pit.tyres, refuel, fuel],
  );
  if (!car) return null;

  const rule = compoundRuleOf(rules, car, commands.pit.tyres ? compound : null);
  const estimate = pitEstimateOf(preview, neutralised);
  const life = Number.isFinite(tyreLife) ? tyreLife : null;
  const exitDelta = preview?.exitPos && position ? preview.exitPos - position : null;
  const km = Number.isFinite(preview?.distanceToPitEntry) ? preview.distanceToPitEntry / 1000 : null;
  const title = t(`Parada de ${car.name}`, `${car.name}: pit stop`);

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="lv-pitdlg">
        <p className="lv-pitdlg__note">
          {pitThisLap ? t("Entra en boxes esta vuelta", "Boxes this lap") : t("Entra en boxes en la próxima vuelta", "Boxes next lap")}
          {km !== null ? ` · ${t(`${km.toFixed(2)} km hasta la entrada`, `${km.toFixed(2)} km to the pit entry`)}` : ""}
          {" · "}
          {t("Sesión en pausa", "Session paused")}
        </p>

        {compounds.length > 0 && (
          <section aria-label={t("Neumático", "Tyre")}>
            <p className="lv-pitdlg__note">
              {t("Montado", "Fitted")}: <Tyre compound={car.compound} age={car.tyreAge} size={16} /> {COMPOUND[car.compound]?.()}
              {life !== null ? ` · ${Math.round(life * 100)}%` : ""}
              {planned ? ` · ${t("Plan", "Plan")}: ${COMPOUND[planned]?.() ?? planned}` : ""}
            </p>
            <div className="lv-pitdlg__tyres" role="radiogroup" aria-label={t("Neumático a montar", "Tyre to fit")}>
              {compounds.map((value) => (
                <button type="button" role="radio" key={value} aria-checked={value === compound} className="lv-pitdlg__tyre" onClick={() => setCompound(value)}>
                  <Tyre compound={value} size={20} />
                  {COMPOUND[value]?.() ?? value}
                  {value === planned ? ` · ${t("plan", "plan")}` : ""}
                </button>
              ))}
            </div>
            {rule.mandatory >= 2 && (
              <p className={rule.after < rule.mandatory ? "lv-pitdlg__warn" : "lv-pitdlg__note"}>
                {t(
                  `Regla de compuestos (en seco): ${rule.before} de ${rule.mandatory} usados; con esta parada, ${Math.min(rule.after, rule.mandatory)} de ${rule.mandatory}`,
                  `Compound rule (dry race): ${rule.before} of ${rule.mandatory} used; with this stop, ${Math.min(rule.after, rule.mandatory)} of ${rule.mandatory}`,
                )}
              </p>
            )}
          </section>
        )}

        {refuel && (
          <div className="lv-step" role="group" aria-label={t("Combustible a cargar", "Fuel to load")}>
            <span>{t("Combustible", "Fuel")}</span>
            <button type="button" className="mn-icon-btn" onClick={() => setFuel((value) => Math.max(1, value - 1))} aria-label={t("Menos combustible", "Less fuel")}>
              −
            </button>
            <b>
              {fuel}
              <small> {t("v", "laps")}</small>
            </b>
            <button type="button" className="mn-icon-btn" onClick={() => setFuel((value) => Math.min(maxFuel, value + 1))} aria-label={t("Más combustible", "More fuel")}>
              +
            </button>
          </div>
        )}

        <dl className="lv-pitdlg__facts">
          <div>
            <dt>{t("Pérdida en verde", "Loss under green")}</dt>
            <dd data-testid="pit-lossGreen">{seconds(preview?.lossGreen)}</dd>
          </div>
          {preview?.scAllowed && (
            <div>
              <dt>{t("Con coche de seguridad", "Under the safety car")}</dt>
              <dd data-testid="pit-lossSc">{seconds(preview?.lossSc)}</dd>
            </div>
          )}
          {preview?.vscAllowed && (
            <div>
              <dt>{t("Con VSC", "Under the VSC")}</dt>
              <dd data-testid="pit-lossVsc">{seconds(preview?.lossVsc)}</dd>
            </div>
          )}
          <div>
            <dt>{t("Parado (típico)", "Stationary (typical)")}</dt>
            <dd data-testid="pit-stopMedian">{seconds(preview?.stopMedian)}</dd>
          </div>
          {estimate && (
            <div>
              <dt>{estimate.kind === "sc" ? t("Cronómetro de línea a línea, con SC", "Line to line, under the SC") : estimate.kind === "vsc" ? t("Cronómetro de línea a línea, con VSC", "Line to line, under the VSC") : t("Cronómetro de línea a línea", "Line to line")}</dt>
              <dd data-testid="pit-lineToLine">{seconds(estimate.sec)}</dd>
            </div>
          )}
          <div>
            <dt>{t("Posición a la salida", "Position at the exit")}</dt>
            <dd data-testid="pit-exitPos">
              {preview?.exitPos ? `P${preview.exitPos}` : "—"}
              {exitDelta ? ` (${exitDelta > 0 ? "+" : ""}${exitDelta})` : ""}
            </dd>
          </div>
        </dl>
        <p className="lv-pitdlg__note">
          {t(
            "Pérdida neta frente a seguir en pista: el pit lane al límite menos el mismo tramo de pista, más la parada típica de tu equipo",
            "Net loss against staying out: the pit lane at the limit less the same stretch of track, plus your crew's typical stop",
          )}
          {preview?.queueSec > 0 ? t(`, más ${preview.queueSec.toFixed(1)} s esperando al compañero`, `, plus ${preview.queueSec.toFixed(1)} s waiting for the team-mate`) : ""}
        </p>
        {preview?.teamMateSameLap && (
          <p className="lv-pitdlg__warn" role="alert">
            {t("Tu compañero para en la misma vuelta: parada doble", "Your team-mate stops on the same lap: double stack")}
          </p>
        )}

        <div className="lv-pitdlg__actions">
          {car.pitRequest && (
            <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={onCancelCall}>
              {t("Anular la parada pedida", "Cancel the call")}
            </button>
          )}
          <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={onClose}>
            {t("Cerrar", "Close")}
          </button>
          <button type="button" className="mn-btn mn-btn--sm" onClick={() => onConfirm(compounds.length ? compound : car.compound, refuel ? { fuel, replace: true } : { replace: true }, preview)}>
            {t("Pedir la parada", "Call the stop")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
