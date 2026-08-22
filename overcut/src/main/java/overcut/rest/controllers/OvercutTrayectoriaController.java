package overcut.rest.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Data bootstrap for the OverCut Trayectoria career game.
 *
 * Everything here is read straight from the f1db-derived caches shipped in
 * {@code resources/scripts} - no live database access, so the endpoint works on a
 * bare checkout:
 *
 *   generic_stats_data.json            drivers/constructors per year, race winners
 *                                      (which is what reconstructs each real calendar),
 *                                      champions per year, wins per season, podiums.
 *   career_lineups.json                the real driver/team pairing of every season.
 *   career_constructor_standings.json  where each car actually finished that year,
 *                                      the honest measure of how fast it was.
 *
 * The response is built once and cached in memory: it is a pure function of files
 * that only change when the caches are regenerated.
 *
 * Unlike the OvercutRacing bootstrap this one also ships the historical record book
 * and the champion lists, because a career is judged against them at retirement.
 */
@RestController
@RequestMapping("/api/overcutTrayectoria")
public class OvercutTrayectoriaController {

    private static final int FIRST_SEASON = 1950;
    private static final int DEFAULT_RATING = 58;

    private final ObjectMapper objectMapper;
    private volatile Map<String, Object> cachedBootstrap;

    public OvercutTrayectoriaController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @GetMapping("/bootstrap")
    public Map<String, Object> bootstrap() throws IOException {
        Map<String, Object> current = cachedBootstrap;
        if (current == null) {
            synchronized (this) {
                current = cachedBootstrap;
                if (current == null) {
                    current = buildBootstrap();
                    cachedBootstrap = current;
                }
            }
        }
        return current;
    }

    private Map<String, Object> buildBootstrap() throws IOException {
        JsonNode root = objectMapper.readTree(
                new ClassPathResource("scripts/generic_stats_data.json").getInputStream());

        Map<String, DriverSeed> drivers = collectDrivers(root);
        Map<String, Integer> driverRatings = buildDriverRatings(root, drivers);
        Map<String, Integer> constructorRatings = buildConstructorRatings(root);

        Map<String, List<Map<String, Object>>> racesByYear =
                groupRacesByYear(root.path("resultados_gp_ganadores"));
        Map<String, List<Map<String, Object>>> constructorStandingsByYear = readConstructorStandings();
        Map<String, List<Map<String, Object>>> lineupsByYear =
                readLineups(driverRatings, constructorRatings, constructorStandingsByYear);

        List<Integer> seasonYears = racesByYear.entrySet().stream()
                .filter(entry -> !entry.getValue().isEmpty())
                .map(entry -> safeInt(entry.getKey()))
                .filter(year -> year >= FIRST_SEASON)
                .sorted()
                .toList();

        int latestSeason = seasonYears.isEmpty() ? 2024 : seasonYears.get(seasonYears.size() - 1);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("dataSource", "f1db -> scripts/*.json -> OvercutTrayectoriaController");
        response.put("currentYear", latestSeason);
        response.put("seasonYears", seasonYears);
        response.put("decades", buildDecades(FIRST_SEASON, latestSeason));
        response.put("racesByYear", racesByYear);
        response.put("lineupsByYear", lineupsByYear);
        response.put("constructorStandingsByYear", constructorStandingsByYear);
        response.put("championsByYear", championsByYear(root));
        response.put("constructorChampionsByYear", constructorChampionsByYear(root));
        response.put("winsBySeason", winsBySeason(root));
        response.put("podiumsBySeason", podiumsBySeason(root));
        response.put("driverProfiles", driverProfiles(drivers, driverRatings));
        response.put("recordBook", recordBook(root));
        return response;
    }

    // ---------------------------------------------------------------- calendars

    /**
     * The winners table has one row per Grand Prix ever run, so grouping it by year
     * rebuilds the real calendar of every season - the order of first appearance in
     * the cache is the order the races were run.
     */
    private Map<String, List<Map<String, Object>>> groupRacesByYear(JsonNode winners) {
        Map<String, LinkedHashSet<String>> grouped = new TreeMap<>();
        for (JsonNode race : winners) {
            String year = race.path("year").asText();
            String name = race.path("gp").asText();
            if (!year.isBlank() && !name.isBlank()) {
                grouped.computeIfAbsent(year, ignored -> new LinkedHashSet<>()).add(name);
            }
        }

        Map<String, List<Map<String, Object>>> racesByYear = new LinkedHashMap<>();
        grouped.forEach((year, names) -> {
            List<Map<String, Object>> races = new ArrayList<>();
            int round = 1;
            for (String name : names) {
                Map<String, Object> race = new LinkedHashMap<>();
                race.put("round", round++);
                race.put("name", name);
                race.put("country", countryOfGrandPrix(name));
                races.add(race);
            }
            racesByYear.put(year, races);
        });
        return racesByYear;
    }

    /**
     * Grand Prix names carry their country in the name itself ("Belgian Grand Prix"),
     * so the flag a race flies resolves without a circuits table. Anything not in the
     * table returns null and the client simply draws no flag.
     */
    private String countryOfGrandPrix(String grandPrix) {
        String key = grandPrix.toLowerCase();
        for (Map.Entry<String, String> entry : GP_COUNTRIES.entrySet()) {
            if (key.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private static final Map<String, String> GP_COUNTRIES = buildGrandPrixCountries();

    private static Map<String, String> buildGrandPrixCountries() {
        // Iteration order matters: the most specific key has to match first, so
        // "san marino" wins over "marino" and "united states" over "states".
        Map<String, String> countries = new LinkedHashMap<>();
        countries.put("70th anniversary", "gb");
        countries.put("emilia", "it");
        countries.put("san marino", "it");
        countries.put("united states", "us");
        countries.put("indianapolis", "us");
        countries.put("detroit", "us");
        countries.put("dallas", "us");
        countries.put("las vegas", "us");
        countries.put("caesars palace", "us");
        countries.put("long beach", "us");
        countries.put("miami", "us");
        countries.put("saudi arabian", "sa");
        countries.put("abu dhabi", "ae");
        countries.put("south african", "za");
        countries.put("great britain", "gb");
        countries.put("british", "gb");
        countries.put("styrian", "at");
        countries.put("austrian", "at");
        countries.put("tuscan", "it");
        countries.put("italian", "it");
        countries.put("sakhir", "bh");
        countries.put("bahrain", "bh");
        countries.put("qatar", "qa");
        countries.put("azerbaijan", "az");
        countries.put("european", "eu");
        countries.put("argentine", "ar");
        countries.put("australian", "au");
        countries.put("belgian", "be");
        countries.put("brazilian", "br");
        countries.put("sao paulo", "br");
        countries.put("canadian", "ca");
        countries.put("chinese", "cn");
        countries.put("dutch", "nl");
        countries.put("french", "fr");
        countries.put("german", "de");
        countries.put("eifel", "de");
        countries.put("luxembourg", "de");
        countries.put("hungarian", "hu");
        countries.put("indian", "in");
        countries.put("japanese", "jp");
        countries.put("pacific", "jp");
        countries.put("korean", "kr");
        countries.put("malaysian", "my");
        countries.put("mexican", "mx");
        countries.put("mexico city", "mx");
        countries.put("monaco", "mc");
        countries.put("moroccan", "ma");
        countries.put("portuguese", "pt");
        countries.put("russian", "ru");
        countries.put("singapore", "sg");
        countries.put("spanish", "es");
        countries.put("swedish", "se");
        countries.put("swiss", "ch");
        countries.put("turkish", "tr");
        countries.put("aida", "jp");
        countries.put("estoril", "pt");
        countries.put("jerez", "es");
        countries.put("imola", "it");
        countries.put("monza", "it");
        countries.put("nurburgring", "de");
        countries.put("zandvoort", "nl");
        countries.put("austria", "at");
        return countries;
    }

    // ------------------------------------------------------------------ ratings

    /**
     * A career-long rating for every driver who ever started a race. It is only a
     * seed: the client re-scales it per season against the field of that year,
     * because a 62 in 1954 and a 62 in 2019 do not mean the same thing.
     */
    private Map<String, Integer> buildDriverRatings(JsonNode root, Map<String, DriverSeed> drivers) {
        Map<String, Integer> podiums = mapInt(root.path("pilotos_podios"), "nombre", "podios");
        Map<String, Integer> seasons = mapInt(root.path("pilotos_temporadas"), "nombre", "temporadas");
        Map<String, Integer> wins = sumInt(root.path("pilotos_victorias_por_temporada"), "nombre", "victorias");
        Map<String, Integer> titles = new HashMap<>();
        for (JsonNode champion : root.path("campeones_pilotos_por_anio")) {
            titles.merge(champion.path("piloto").asText(), 1, Integer::sum);
        }

        Map<String, Integer> ratings = new HashMap<>();
        drivers.forEach((name, seed) -> {
            double score = 52
                    + Math.sqrt(podiums.getOrDefault(name, 0)) * 2.65
                    + wins.getOrDefault(name, 0) * 0.32
                    + titles.getOrDefault(name, 0) * 5.8
                    + seasons.getOrDefault(name, seed.years.size()) * 0.42
                    + deterministicJitter(name, 7);
            ratings.put(name, clampRating(score));
        });
        return ratings;
    }

    private Map<String, Integer> buildConstructorRatings(JsonNode root) {
        Map<String, Integer> titles = mapInt(root.path("constructores_titulos"), "nombre", "titulos");
        Map<String, Integer> doubles = mapInt(root.path("constructores_dobletes"), "nombre", "dobletes");
        Map<String, Integer> podiums = sumInt(root.path("constructores_podios_por_temporada"), "nombre", "podios");

        Map<String, Integer> appearances = new HashMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = root.path("constructores_por_anio").fields();
        while (fields.hasNext()) {
            for (JsonNode item : fields.next().getValue()) {
                appearances.merge(item.asText(), 1, Integer::sum);
            }
        }

        Map<String, Integer> ratings = new HashMap<>();
        appearances.forEach((name, years) -> {
            double score = 50
                    + Math.sqrt(podiums.getOrDefault(name, 0)) * 2.25
                    + titles.getOrDefault(name, 0) * 4.3
                    + Math.sqrt(doubles.getOrDefault(name, 0)) * 1.5
                    + years * 0.34
                    + deterministicJitter(name, 8);
            ratings.put(name, clampRating(score));
        });
        return ratings;
    }

    // ------------------------------------------------------------------ lineups

    private Map<String, List<Map<String, Object>>> readLineups(
            Map<String, Integer> driverRatings,
            Map<String, Integer> constructorRatings,
            Map<String, List<Map<String, Object>>> constructorStandingsByYear) {

        Map<String, List<Map<String, Object>>> byYear = new LinkedHashMap<>();
        try {
            JsonNode root = objectMapper.readTree(
                    new ClassPathResource("scripts/career_lineups.json").getInputStream());
            Iterator<Map.Entry<String, JsonNode>> years = root.path("lineupsByYear").fields();
            while (years.hasNext()) {
                Map.Entry<String, JsonNode> yearEntry = years.next();
                List<Map<String, Object>> teams = new ArrayList<>();
                for (JsonNode teamNode : yearEntry.getValue()) {
                    String teamName = teamNode.path("team").asText();
                    if (teamName.isBlank()) {
                        continue;
                    }
                    List<Map<String, Object>> drivers = new ArrayList<>();
                    for (JsonNode driverNode : teamNode.path("drivers")) {
                        String name = driverNode.path("name").asText();
                        if (name.isBlank()) {
                            continue;
                        }
                        Map<String, Object> driver = new LinkedHashMap<>();
                        driver.put("name", name);
                        driver.put("rating", driverRatings.getOrDefault(name, DEFAULT_RATING));
                        driver.put("races", driverNode.path("races").asInt(0));
                        drivers.add(driver);
                    }
                    Map<String, Object> team = new LinkedHashMap<>();
                    team.put("id", slug(teamName));
                    team.put("team", teamName);
                    team.put("rating", constructorRatings.getOrDefault(teamName, DEFAULT_RATING));
                    team.put("races", teamNode.path("races").asInt(0));
                    Map<String, Object> standing =
                            findStanding(constructorStandingsByYear.get(yearEntry.getKey()), teamName);
                    if (standing != null) {
                        team.put("points", standing.get("points"));
                        team.put("standingPosition", standing.get("position"));
                    }
                    team.put("drivers", drivers);
                    teams.add(team);
                }
                byYear.put(yearEntry.getKey(), teams);
            }
        } catch (IOException | RuntimeException ex) {
            return Map.of();
        }
        return byYear;
    }

    private Map<String, List<Map<String, Object>>> readConstructorStandings() {
        Map<String, List<Map<String, Object>>> byYear = new LinkedHashMap<>();
        try {
            JsonNode root = objectMapper.readTree(
                    new ClassPathResource("scripts/career_constructor_standings.json").getInputStream());
            Iterator<Map.Entry<String, JsonNode>> years = root.path("constructorStandingsByYear").fields();
            while (years.hasNext()) {
                Map.Entry<String, JsonNode> yearEntry = years.next();
                List<Map<String, Object>> rows = new ArrayList<>();
                for (JsonNode rowNode : yearEntry.getValue()) {
                    String teamName = rowNode.path("team").asText();
                    if (teamName.isBlank()) {
                        continue;
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("team", teamName);
                    row.put("position",
                            rowNode.path("position").isMissingNode() ? null : rowNode.path("position").asInt());
                    row.put("points", rowNode.path("points").asDouble(0));
                    rows.add(row);
                }
                byYear.put(yearEntry.getKey(), rows);
            }
        } catch (IOException | RuntimeException ex) {
            return Map.of();
        }
        return byYear;
    }

    private Map<String, Object> findStanding(List<Map<String, Object>> rows, String teamName) {
        if (rows == null) {
            return null;
        }
        for (Map<String, Object> row : rows) {
            if (teamName.equals(row.get("team"))) {
                return row;
            }
        }
        return null;
    }

    // -------------------------------------------------------------- history bits

    private Map<String, String> championsByYear(JsonNode root) {
        Map<String, String> champions = new TreeMap<>();
        for (JsonNode item : root.path("campeones_pilotos_por_anio")) {
            String year = item.path("year").asText();
            String driver = item.path("piloto").asText();
            if (!year.isBlank() && !driver.isBlank()) {
                champions.put(year, driver);
            }
        }
        return champions;
    }

    private Map<String, String> constructorChampionsByYear(JsonNode root) {
        Map<String, String> champions = new TreeMap<>();
        for (JsonNode item : root.path("campeones_constructores_por_anio")) {
            String year = item.path("year").asText();
            String team = item.path("constructor").asText();
            if (team.isBlank()) {
                team = item.path("escuderia").asText();
            }
            if (!year.isBlank() && !team.isBlank()) {
                champions.put(year, team);
            }
        }
        return champions;
    }

    /**
     * Driver to year to podium finishes.
     *
     * The three podium tables hold one row per Grand Prix ever run, so counting a
     * driver's rows in a given year is how many times they stood on the podium that
     * season. A career rating says how good someone was over twenty years; this is
     * the only per-season measure of a driver the caches can give, and it is what
     * stops a season being scored on reputation alone.
     */
    private Map<String, Map<String, Integer>> podiumsBySeason(JsonNode root) {
        Map<String, Map<String, Integer>> podiums = new LinkedHashMap<>();
        for (String table : PODIUM_TABLES) {
            for (JsonNode item : root.path(table)) {
                String name = item.path("piloto").asText();
                String year = item.path("year").asText();
                if (name.isBlank() || year.isBlank()) {
                    continue;
                }
                podiums.computeIfAbsent(name, ignored -> new TreeMap<>()).merge(year, 1, Integer::sum);
            }
        }
        return podiums;
    }

    private static final List<String> PODIUM_TABLES =
            List.of("resultados_gp_ganadores", "resultados_gp_segundos", "resultados_gp_terceros");

    /** driver to year to wins, so a season can be told apart from a whole career. */
    private Map<String, Map<String, Integer>> winsBySeason(JsonNode root) {
        Map<String, Map<String, Integer>> wins = new LinkedHashMap<>();
        for (JsonNode item : root.path("pilotos_victorias_por_temporada")) {
            String name = item.path("nombre").asText();
            String year = item.path("year").asText();
            if (name.isBlank() || year.isBlank()) {
                continue;
            }
            wins.computeIfAbsent(name, ignored -> new TreeMap<>())
                    .merge(year, item.path("victorias").asInt(0), Integer::sum);
        }
        return wins;
    }

    private List<Map<String, Object>> driverProfiles(
            Map<String, DriverSeed> drivers, Map<String, Integer> ratings) {

        List<Map<String, Object>> profiles = new ArrayList<>();
        drivers.forEach((name, seed) -> {
            Map<String, Object> profile = new LinkedHashMap<>();
            profile.put("id", slug(name));
            profile.put("name", name);
            profile.put("firstYear", seed.firstYear);
            profile.put("lastYear", seed.lastYear);
            profile.put("seasons", seed.years.size());
            profile.put("rating", ratings.getOrDefault(name, DEFAULT_RATING));
            profiles.add(profile);
        });
        profiles.sort(Comparator.comparing(item -> (String) item.get("name")));
        return profiles;
    }

    /**
     * What a career is measured against at retirement: the all-time leaders in the
     * same numbers the game itself tracks.
     */
    private Map<String, Object> recordBook(JsonNode root) {
        Map<String, Integer> titles = new HashMap<>();
        for (JsonNode champion : root.path("campeones_pilotos_por_anio")) {
            titles.merge(champion.path("piloto").asText(), 1, Integer::sum);
        }
        Map<String, Integer> wins = sumInt(root.path("pilotos_victorias_por_temporada"), "nombre", "victorias");
        Map<String, Integer> podiums = mapInt(root.path("pilotos_podios"), "nombre", "podios");
        Map<String, Integer> seasons = mapInt(root.path("pilotos_temporadas"), "nombre", "temporadas");

        Map<String, Object> book = new LinkedHashMap<>();
        book.put("titles", topOf(titles, 25));
        book.put("wins", topOf(wins, 25));
        book.put("podiums", topOf(podiums, 25));
        book.put("seasons", topOf(seasons, 25));
        return book;
    }

    private List<Map<String, Object>> topOf(Map<String, Integer> values, int limit) {
        return values.entrySet().stream()
                .filter(entry -> !entry.getKey().isBlank() && entry.getValue() > 0)
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()
                        .thenComparing(Map.Entry::getKey))
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", entry.getKey());
                    row.put("value", entry.getValue());
                    return row;
                })
                .toList();
    }

    // ------------------------------------------------------------------ helpers

    private Map<String, DriverSeed> collectDrivers(JsonNode root) {
        Map<String, DriverSeed> drivers = new LinkedHashMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = root.path("pilotos_por_anio").fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            int year = safeInt(field.getKey());
            for (JsonNode item : field.getValue()) {
                String name = item.asText();
                if (name == null || name.isBlank()) {
                    continue;
                }
                DriverSeed seed = drivers.computeIfAbsent(name, ignored -> new DriverSeed());
                seed.firstYear = Math.min(seed.firstYear, year);
                seed.lastYear = Math.max(seed.lastYear, year);
                seed.years.add(year);
            }
        }
        return drivers;
    }

    private List<Map<String, Object>> buildDecades(int firstYear, int currentYear) {
        List<Map<String, Object>> decades = new ArrayList<>();
        for (int start = firstYear; start <= currentYear; start += 10) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("key", (start / 10 * 10) + "s");
            item.put("label", start + "s");
            item.put("from", start);
            item.put("to", Math.min(start + 9, currentYear));
            decades.add(item);
        }
        return decades;
    }

    private Map<String, Integer> mapInt(JsonNode array, String nameKey, String valueKey) {
        Map<String, Integer> values = new HashMap<>();
        for (JsonNode item : array) {
            String name = item.path(nameKey).asText();
            if (!name.isBlank()) {
                values.put(name, item.path(valueKey).asInt());
            }
        }
        return values;
    }

    private Map<String, Integer> sumInt(JsonNode array, String nameKey, String valueKey) {
        Map<String, Integer> values = new HashMap<>();
        for (JsonNode item : array) {
            String name = item.path(nameKey).asText();
            if (!name.isBlank()) {
                values.merge(name, item.path(valueKey).asInt(), Integer::sum);
            }
        }
        return values;
    }

    private int clampRating(double score) {
        return Math.max(45, Math.min(99, (int) Math.round(score)));
    }

    private double deterministicJitter(String value, int spread) {
        int hash = Math.abs(value.hashCode());
        return (hash % (spread * 2 + 1)) - spread;
    }

    private String slug(String value) {
        String stripped = Normalizer.normalize(value.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return stripped
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private int safeInt(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private static final class DriverSeed {
        private int firstYear = Integer.MAX_VALUE;
        private int lastYear = Integer.MIN_VALUE;
        private final Set<Integer> years = new LinkedHashSet<>();
    }
}
