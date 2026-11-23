// Ganchos de carga ESM para leer el motor del Manager desde Node (pipeline de assets, ADR-001).
//
// El motor se escribe para el bundler de CRA: importa sin extensión ("./sim/physics") y lee JSON con
// `import data from "x.json"`. Node ESM exige la extensión y el atributo `type: "json"`. Estos ganchos
// solo actúan sobre ficheros del motor: prueban ".js" si falta la extensión y cargan los .json como módulo
// con `export default`. Uso: `import "./engine_loader.mjs";` antes del primer `await import(...)` del motor.
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

const ENGINE = "/src/modules/";

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      const fromEngine = context.parentURL && context.parentURL.includes(ENGINE);
      const relative = specifier.startsWith("./") || specifier.startsWith("../");
      if (!fromEngine || !relative || /\.[cm]?js$|\.json$/.test(specifier)) throw error;
      return next(`${specifier}.js`, context);
    }
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.includes(ENGINE) && url.endsWith(".json")) {
      return { format: "module", source: `export default ${readFileSync(new URL(url), "utf8")};`, shortCircuit: true };
    }
    // Los .js del motor son ESM aunque el package.json de CRA no lo diga (evita reparsear y el aviso).
    if (url.startsWith("file:") && url.includes(ENGINE) && url.endsWith(".js")) return next(url, { ...context, format: "module" });
    return next(url, context);
  },
});
