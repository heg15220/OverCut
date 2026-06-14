package overcut.rest.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/overcutRacing")
public class OvercutRacingController {

    private final ObjectMapper objectMapper;
    private volatile Map<String, Object> cachedBootstrap;

    public OvercutRacingController(ObjectMapper objectMapper) {
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
        JsonNode root = objectMapper.readTree(new ClassPathResource("scripts/generic_stats_data.json").getInputStream());

        Map<String, EntitySeed> drivers = collectEntities(root.path("pilotos_por_anio"));
        Map<String, EntitySeed> constructors = collectEntities(root.path("constructores_por_anio"));

        Map<String, Integer> driverRatings = buildDriverRatings(root, drivers);
        Map<String, Integer> constructorRatings = buildConstructorRatings(root, constructors);

        Map<String, List<Map<String, Object>>> driversByDecade = groupByDecade(drivers, driverRatings);
        Map<String, List<Map<String, Object>>> constructorsByDecade = groupByDecade(constructors, constructorRatings);
        Map<String, List<Map<String, Object>>> racesByYear = groupRacesByYear(root.path("resultados_gp_ganadores"));

        List<Integer> seasonYears = playableSeasonYears(racesByYear);
        int maxDataYear = streamInts(root.path("temporadas")).stream()
                .mapToInt(Integer::intValue)
                .max()
                .orElse(seasonYears.isEmpty() ? 2024 : seasonYears.get(seasonYears.size() - 1));
        int latestRaceYear = seasonYears.isEmpty() ? maxDataYear : seasonYears.get(seasonYears.size() - 1);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("currentYear", latestRaceYear);
        response.put("dataCoverageYear", maxDataYear);
        response.put("dataSource", "f1db -> scripts/generate_generic_stats_data.py -> scripts/generic_stats_data.json");
        response.put("seasonYears", seasonYears);
        response.put("decades", buildDecades(1950, maxDataYear));
        response.put("teamsByDecade", constructorsByDecade);
        response.put("driversByDecade", driversByDecade);
        response.put("racesByYear", racesByYear);
        Map<String, List<Map<String, Object>>> constructorStandingsByYear = buildConstructorStandingsByYear();
        response.put("constructorStandingsByYear", constructorStandingsByYear);
        response.put("lineupsByYear", buildLineupsByYear(driverRatings, constructorRatings, constructorStandingsByYear));
        return response;
    }

    // Real per-season grid (team <-> drivers) extracted from f1db by
    // scripts/generate_career_lineups.py. Drivers and team names match the
    // strings the rest of the bootstrap uses, so ratings join cleanly. Returns
    // an empty map if the cache is absent, so the client falls back gracefully.
    private Map<String, Object> buildLineupsByYear(
            Map<String, Integer> driverRatings,
            Map<String, Integer> constructorRatings,
            Map<String, List<Map<String, Object>>> constructorStandingsByYear) {

        Map<String, Object> byYear = new LinkedHashMap<>();
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
                        driver.put("rating", driverRatings.getOrDefault(name, 58));
                        driver.put("races", driverNode.path("races").asInt(0));
                        drivers.add(driver);
                    }
                    Map<String, Object> team = new LinkedHashMap<>();
                    team.put("id", slug(teamName));
                    team.put("team", teamName);
                    team.put("rating", constructorRatings.getOrDefault(teamName, 58));
                    team.put("races", teamNode.path("races").asInt(0));
                    Map<String, Object> standing = findConstructorStanding(
                            constructorStandingsByYear.get(yearEntry.getKey()), teamName);
                    if (standing != null) {
                        team.put("points", standing.get("points"));
                        team.put("constructorPoints", standing.get("points"));
                        team.put("standingPosition", standing.get("position"));
                    }
                    if (teamNode.hasNonNull("points")) {
                        team.put("points", teamNode.path("points").asDouble());
                    }
                    if (teamNode.hasNonNull("constructorPoints")) {
                        team.put("constructorPoints", teamNode.path("constructorPoints").asDouble());
                    }
                    if (teamNode.hasNonNull("standingPosition")) {
                        team.put("standingPosition", teamNode.path("standingPosition").asInt());
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

    private Map<String, List<Map<String, Object>>> buildConstructorStandingsByYear() {
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
                    row.put("position", rowNode.path("position").isMissingNode() ? null : rowNode.path("position").asInt());
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

    private Map<String, Object> findConstructorStanding(List<Map<String, Object>> rows, String teamName) {
        if (rows == null || rows.isEmpty()) {
            return null;
        }
        for (Map<String, Object> row : rows) {
            if (teamName.equals(row.get("team"))) {
                return row;
            }
        }
        return null;
    }

    private Map<String, EntitySeed> collectEntities(JsonNode byYear) {
        Map<String, EntitySeed> entities = new LinkedHashMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = byYear.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            int year = safeInt(field.getKey());
            for (JsonNode item : field.getValue()) {
                String name = item.asText();
                if (name == null || name.isBlank()) {
                    continue;
                }
                EntitySeed seed = entities.computeIfAbsent(name, EntitySeed::new);
                seed.firstYear = Math.min(seed.firstYear, year);
                seed.lastYear = Math.max(seed.lastYear, year);
                seed.years.add(year);
            }
        }
        return entities;
    }

    private Map<String, Integer> buildDriverRatings(JsonNode root, Map<String, EntitySeed> drivers) {
        Map<String, Integer> podiums = mapInt(root.path("pilotos_podios"), "nombre", "podios");
        Map<String, Integer> seasons = mapInt(root.path("pilotos_temporadas"), "nombre", "temporadas");
        Map<String, Integer> wins = sumInt(root.path("pilotos_victorias_por_temporada"), "nombre", "victorias");
        Map<String, Integer> titles = new HashMap<>();
        for (JsonNode champion : root.path("campeones_pilotos_por_anio")) {
            String name = champion.path("piloto").asText();
            titles.merge(name, 1, Integer::sum);
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

    private Map<String, Integer> buildConstructorRatings(JsonNode root, Map<String, EntitySeed> constructors) {
        Map<String, Integer> titles = mapInt(root.path("constructores_titulos"), "nombre", "titulos");
        Map<String, Integer> doubles = mapInt(root.path("constructores_dobletes"), "nombre", "dobletes");
        Map<String, Integer> podiums = sumInt(root.path("constructores_podios_por_temporada"), "nombre", "podios");

        Map<String, Integer> ratings = new HashMap<>();
        constructors.forEach((name, seed) -> {
            double score = 50
                    + Math.sqrt(podiums.getOrDefault(name, 0)) * 2.25
                    + titles.getOrDefault(name, 0) * 4.3
                    + Math.sqrt(doubles.getOrDefault(name, 0)) * 1.5
                    + seed.years.size() * 0.34
                    + deterministicJitter(name, 8);
            ratings.put(name, clampRating(score));
        });
        return ratings;
    }

    private Map<String, List<Map<String, Object>>> groupByDecade(
            Map<String, EntitySeed> entities,
            Map<String, Integer> ratings) {

        Map<String, List<Map<String, Object>>> byDecade = new LinkedHashMap<>();
        entities.values().forEach(seed -> {
            Set<String> entityDecades = new HashSet<>();
            seed.years.forEach(year -> entityDecades.add(decadeKey(year)));
            entityDecades.forEach(decade -> byDecade
                    .computeIfAbsent(decade, ignored -> new ArrayList<>())
                    .add(entityToMap(seed, ratings.getOrDefault(seed.name, 58), decade)));
        });

        byDecade.values().forEach(items -> items.sort(
                Comparator.<Map<String, Object>, Integer>comparing(item -> (Integer) item.get("rating")).reversed()
                        .thenComparing(item -> (String) item.get("name"))));

        return byDecade;
    }

    private Map<String, Object> entityToMap(EntitySeed seed, int rating, String decade) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", slug(seed.name));
        item.put("name", seed.name);
        item.put("decade", decade);
        item.put("firstYear", seed.firstYear);
        item.put("lastYear", seed.lastYear);
        item.put("seasons", seed.years.size());
        item.put("rating", rating);
        return item;
    }

    private Map<String, List<Map<String, Object>>> groupRacesByYear(JsonNode winners) {
        Map<String, LinkedHashSet<String>> grouped = new LinkedHashMap<>();
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
                races.add(race);
            }
            racesByYear.put(year, races);
        });
        return racesByYear;
    }

    private List<Integer> playableSeasonYears(Map<String, List<Map<String, Object>>> racesByYear) {
        return racesByYear.entrySet().stream()
                .filter(entry -> !entry.getValue().isEmpty())
                .map(entry -> safeInt(entry.getKey()))
                .filter(year -> year >= 1950)
                .sorted()
                .toList();
    }

    private List<Map<String, Object>> buildDecades(int firstYear, int currentYear) {
        List<Map<String, Object>> decades = new ArrayList<>();
        for (int start = firstYear; start <= currentYear; start += 10) {
            int end = Math.min(start + 9, currentYear);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("key", decadeKey(start));
            item.put("label", start + "s");
            item.put("from", start);
            item.put("to", end);
            decades.add(item);
        }
        return decades;
    }

    private Map<String, Integer> mapInt(JsonNode array, String nameKey, String valueKey) {
        Map<String, Integer> values = new HashMap<>();
        for (JsonNode item : array) {
            String name = item.path(nameKey).asText();
            int value = item.path(valueKey).asInt();
            if (!name.isBlank()) {
                values.put(name, value);
            }
        }
        return values;
    }

    private Map<String, Integer> sumInt(JsonNode array, String nameKey, String valueKey) {
        Map<String, Integer> values = new HashMap<>();
        for (JsonNode item : array) {
            String name = item.path(nameKey).asText();
            int value = item.path(valueKey).asInt();
            if (!name.isBlank()) {
                values.merge(name, value, Integer::sum);
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

    private String decadeKey(int year) {
        return (year / 10 * 10) + "s";
    }

    private String slug(String value) {
        return value.toLowerCase()
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

    private List<Integer> streamInts(JsonNode array) {
        List<Integer> values = new ArrayList<>();
        for (JsonNode item : array) {
            values.add(item.asInt());
        }
        return values;
    }

    private static final class EntitySeed {
        private final String name;
        private int firstYear = Integer.MAX_VALUE;
        private int lastYear = Integer.MIN_VALUE;
        private final Set<Integer> years = new LinkedHashSet<>();

        private EntitySeed(String name) {
            this.name = name;
        }
    }
}
