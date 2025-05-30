package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.ConstructorDao;
import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
import com.overcut.f1hub.rest.dtos.DriverRankingDTO;
import com.overcut.f1hub.rest.dtos.DriverStandingDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@Service
public class StatisticsServiceImpl implements StatisticsService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private ConstructorDao constructorDao;

    @Override
    public List<ConstructorOption> getAllConstructors() {
        return constructorDao.findAll().stream()
                .map(c -> new ConstructorOption(c.getConstructorId(), c.getName()))
                .sorted(Comparator.comparing(ConstructorOption::name))
                .toList();
    }

    @Override
    public List<DriverStandingDTO> getDriverStandings(int year) {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality,
               c.constructorRef, c.name, SUM(p.points) AS totalPoints
        FROM (
            SELECT r.driverId, r.constructorId, r.points, r.raceId
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year = :year

            UNION ALL

            SELECT sr.driverId, sr.constructorId, sr.points, sr.raceId
            FROM sprintresults sr
            JOIN races ra ON sr.raceId = ra.raceId
            WHERE ra.year = :year
        ) p
        JOIN drivers d ON d.driverId = p.driverId
        JOIN constructors c ON c.constructorId = p.constructorId
        GROUP BY d.driverId, c.constructorId
        ORDER BY d.driverId, totalPoints DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("year", year);

        List<Object[]> rows = query.getResultList();
        List<DriverStandingDTO> result = new ArrayList<>();
        List<Long> includedDriverIds = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String forename = (String) row[1];
            String surname = (String) row[2];
            String nationality = (String) row[3];
            String constructorRef = (String) row[4];
            String constructorName = (String) row[5];
            double totalPoints = ((Number) row[6]).doubleValue();

            if (!includedDriverIds.contains(driverId)) {
                includedDriverIds.add(driverId);
                String fullName = forename + " " + surname;
                String flagUrl = getFlagUrl(nationality);
                String teamColor = getTeamColor(constructorRef);

                result.add(new DriverStandingDTO(
                        fullName,
                        nationality,
                        constructorName,
                        teamColor,
                        totalPoints,
                        flagUrl
                ));
            }
        }

        // Ordenar finalmente por puntos descendente
        result.sort((a, b) -> Double.compare(b.getTotalPoints(), a.getTotalPoints()));
        return result;
    }




    @Override
    public List<ConstructorStandingDTO> getConstructorStandings(int year) {
        String sql = """
        SELECT c.constructorRef, c.name, SUM(all_points.points) AS totalPoints
        FROM (
            SELECT r.constructorId, r.points
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year = :year

            UNION ALL

            SELECT sr.constructorId, sr.points
            FROM sprintresults sr
            JOIN races ra ON sr.raceId = ra.raceId
            WHERE ra.year = :year
        ) AS all_points
        JOIN constructors c ON all_points.constructorId = c.constructorId
        GROUP BY c.constructorId
        ORDER BY totalPoints DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("year", year);

        List<Object[]> rows = query.getResultList();
        List<ConstructorStandingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String constructorRef = (String) row[0];
            String name = (String) row[1];
            double totalPoints = ((Number) row[2]).doubleValue();
            String teamColor = getTeamColor(constructorRef);

            result.add(new ConstructorStandingDTO(name, totalPoints, teamColor));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverWinRanking() {
        String sql = """
                SELECT d.forename, d.surname, d.nationality, COUNT(*) AS wins
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1
                GROUP BY d.driverId
                ORDER BY wins DESC
                """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String forename = (String) row[0];
            String surname = (String) row[1];
            String nationality = (String) row[2];
            int wins = ((Number) row[3]).intValue();
            String flagUrl = getFlagUrl(nationality);

            result.add(new DriverRankingDTO(forename + " " + surname, nationality, wins, flagUrl));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverPodiumRanking() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS podiums
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder <= 3
        GROUP BY d.driverId
        ORDER BY podiums DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String forename = (String) row[0];
            String surname = (String) row[1];
            String nationality = (String) row[2];
            int podiums = ((Number) row[3]).intValue();
            String flagUrl = getFlagUrl(nationality);
            result.add(new DriverRankingDTO(forename + " " + surname, nationality, podiums, flagUrl));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriverPoleRanking() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS poles
        FROM qualifying q
        JOIN races ra ON q.raceId = ra.raceId
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.position = 1 AND ra.year >= 2003
        GROUP BY d.driverId
        ORDER BY poles DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int value = ((Number) row[3]).intValue();
            String flagUrl = getFlagUrl(nationality);
            result.add(new DriverRankingDTO(name, nationality, value, flagUrl));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverGrandChelemRanking() {
        List<DriverRankingDTO> list = new ArrayList<>();

        list.add(new DriverRankingDTO("Jim Clark", "British", 8, getFlagUrl("british")));
        list.add(new DriverRankingDTO("Lewis Hamilton", "British", 6, getFlagUrl("british")));
        list.add(new DriverRankingDTO("Alberto Ascari", "Italian", 5, getFlagUrl("italian")));
        list.add(new DriverRankingDTO("Michael Schumacher", "German", 5, getFlagUrl("german")));
        list.add(new DriverRankingDTO("Max Verstappen", "Dutch", 5, getFlagUrl("dutch")));
        list.add(new DriverRankingDTO("Jackie Stewart", "British", 4, getFlagUrl("british")));
        list.add(new DriverRankingDTO("Ayrton Senna", "Brazilian", 4, getFlagUrl("brazilian")));
        list.add(new DriverRankingDTO("Nigel Mansell", "British", 4, getFlagUrl("british")));
        list.add(new DriverRankingDTO("Sebastian Vettel", "German", 4, getFlagUrl("german")));
        list.add(new DriverRankingDTO("Nelson Piquet", "Brazilian", 3, getFlagUrl("brazilian")));
        list.add(new DriverRankingDTO("Juan Manuel Fangio", "Argentine", 2, getFlagUrl("argentine")));
        list.add(new DriverRankingDTO("Jack Brabham", "Australian", 2, getFlagUrl("australian")));
        list.add(new DriverRankingDTO("Mika Hakkinen", "Finnish", 2, getFlagUrl("finnish")));
        list.add(new DriverRankingDTO("Nico Rosberg", "German", 2, getFlagUrl("german")));
        list.add(new DriverRankingDTO("Mike Hawthorn", "British", 1, getFlagUrl("british")));
        list.add(new DriverRankingDTO("Stirling Moss", "British", 1, getFlagUrl("british")));
        list.add(new DriverRankingDTO("Jo Siffert", "Swiss", 1, getFlagUrl("swiss")));
        list.add(new DriverRankingDTO("Jacky Ickx", "Belgian", 1, getFlagUrl("belgian")));
        list.add(new DriverRankingDTO("Clay Regazzoni", "Swiss", 1, getFlagUrl("swiss")));
        list.add(new DriverRankingDTO("Niki Lauda", "Austrian", 1, getFlagUrl("austrian")));
        list.add(new DriverRankingDTO("Jacques Laffite", "French", 1, getFlagUrl("french")));
        list.add(new DriverRankingDTO("Gilles Villeneuve", "Canadian", 1, getFlagUrl("canadian")));
        list.add(new DriverRankingDTO("Gerhard Berger", "Austrian", 1, getFlagUrl("austrian")));
        list.add(new DriverRankingDTO("Damon Hill", "British", 1, getFlagUrl("british")));
        list.add(new DriverRankingDTO("Fernando Alonso", "Spanish", 1, getFlagUrl("spanish")));
        list.add(new DriverRankingDTO("Charles Leclerc", "Monegasque", 1, getFlagUrl("monegasque")));

        return list;
    }

    private List<DriverRankingDTO> mapToDriverRankingDTOList(String sql) {
        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String forename = (String) row[0];
            String surname = (String) row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            String fullName = forename + " " + surname;
            String flagUrl = getFlagUrl(nationality);

            result.add(new DriverRankingDTO(fullName, nationality, count, flagUrl));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getWorldChampionsByTitleCount() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) as titles
        FROM driverstandings ds
        JOIN races r ON ds.raceId = r.raceId
        JOIN (
            SELECT year, MAX(round) AS last_round
            FROM races
            GROUP BY year
        ) last_races ON r.year = last_races.year AND r.round = last_races.last_round
        JOIN drivers d ON ds.driverId = d.driverId
        WHERE ds.position = 1
        GROUP BY d.driverId
        ORDER BY titles DESC
    """;

        return mapToDriverRankingDTOList(sql);
    }


    public List<DriverRankingDTO> getWorldChampionsChronologically() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, r.year
        FROM driverstandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1
        AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
        ORDER BY r.year DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int year = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, year, getFlagUrl(nationality)));
        }
        return result;
    }




    @Override
    public List<DriverRankingDTO> getDriverWinsByTeam(String constructorName) {
        String constructorRef = constructorDao.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(constructorName.replace("_", " ")))
                .findFirst()
                .map(c -> c.getConstructorRef())
                .orElseThrow(() -> new RuntimeException("Constructor no encontrado: " + constructorName));

        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS wins
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.positionOrder = 1 AND c.constructorRef = :constructorRef
        GROUP BY d.driverId
        ORDER BY wins DESC
    """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("constructorRef", constructorRef);

        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String fullName = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(fullName, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriverPodiumsByTeam(String constructorName) {
        String constructorRef = constructorDao.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(constructorName.replace("_", " ")))
                .findFirst()
                .map(c -> c.getConstructorRef())
                .orElseThrow(() -> new RuntimeException("Constructor no encontrado: " + constructorName));

        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS podiums
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.positionOrder <= 3 AND c.constructorRef = :constructorRef
        GROUP BY d.driverId
        ORDER BY podiums DESC
    """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("constructorRef", constructorRef);

        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String fullName = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(fullName, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriverPolesByTeamSince2003(String constructorName) {
        String constructorRef = constructorDao.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(constructorName.replace("_", " ")))
                .findFirst()
                .map(c -> c.getConstructorRef())
                .orElseThrow(() -> new RuntimeException("Constructor no encontrado: " + constructorName));

        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS poles
        FROM qualifying q
        JOIN races ra ON q.raceId = ra.raceId
        JOIN drivers d ON q.driverId = d.driverId
        JOIN constructors c ON q.constructorId = c.constructorId
        WHERE q.position = 1 AND ra.year >= 2003 AND c.constructorRef = :constructorRef
        GROUP BY d.driverId
        ORDER BY poles DESC
    """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("constructorRef", constructorRef);

        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String fullName = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(fullName, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }



    public List<DriverRankingDTO> getChampionsByYoungestAge() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, d.dob, r.date
        FROM driverstandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1
        AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream()
                .map(row -> {
                    String name = row[0] + " " + row[1];
                    String nationality = (String) row[2];
                    LocalDate dob = ((Date) row[3]).toLocalDate();
                    LocalDate titleDate = ((Date) row[4]).toLocalDate();
                    int age = Period.between(dob, titleDate).getYears();
                    return new DriverRankingDTO(name, nationality, age, getFlagUrl(nationality));
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue))
                .toList();
    }



    public List<DriverRankingDTO> getConsecutiveTitles() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, r.year
        FROM driverstandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1
        AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
        ORDER BY d.driverId, r.year
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        Map<Long, List<Integer>> yearsByDriver = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int year = ((Number) row[4]).intValue();
            yearsByDriver.computeIfAbsent(driverId, k -> new ArrayList<>()).add(year);
        }

        List<DriverRankingDTO> result = new ArrayList<>();
        for (Map.Entry<Long, List<Integer>> entry : yearsByDriver.entrySet()) {
            List<Integer> years = entry.getValue();
            int maxStreak = 1, current = 1;
            for (int i = 1; i < years.size(); i++) {
                if (years.get(i) == years.get(i - 1) + 1) current++;
                else current = 1;
                maxStreak = Math.max(maxStreak, current);
            }

            if (maxStreak >= 2) {
                Object[] row = rows.stream().filter(r -> ((Number) r[0]).longValue() == entry.getKey()).findFirst().get();
                String name = row[1] + " " + row[2];
                String nationality = (String) row[3];
                result.add(new DriverRankingDTO(name, nationality, maxStreak, getFlagUrl(nationality)));
            }
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result;
    }

    public List<DriverRankingDTO> getLongestIntervalBetweenTitles() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, r.year
        FROM driverstandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1
        AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
        ORDER BY d.driverId, r.year
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        Map<Long, List<Integer>> yearsByDriver = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int year = ((Number) row[4]).intValue();
            yearsByDriver.computeIfAbsent(driverId, k -> new ArrayList<>()).add(year);
        }

        List<DriverRankingDTO> result = new ArrayList<>();
        for (Map.Entry<Long, List<Integer>> entry : yearsByDriver.entrySet()) {
            List<Integer> years = entry.getValue();
            if (years.size() >= 2) {
                int interval = years.get(years.size() - 1) - years.get(0);
                Object[] row = rows.stream().filter(r -> ((Number) r[0]).longValue() == entry.getKey()).findFirst().get();
                String name = row[1] + " " + row[2];
                String nationality = (String) row[3];
                result.add(new DriverRankingDTO(name, nationality, interval, getFlagUrl(nationality)));
            }
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result;
    }

    @Override
    public List<DriverRankingDTO> getGpCountBeforeFirstTitle() {
        String championInfoSql = """
        SELECT ds.driverId, d.forename, d.surname, d.nationality
        FROM driverstandings ds
        JOIN races r ON ds.raceId = r.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN (
            SELECT ds.driverId, MIN(r.year) AS first_title_year
            FROM driverstandings ds
            JOIN races r ON ds.raceId = r.raceId
            WHERE ds.position = 1
              AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
            GROUP BY ds.driverId
        ) ft ON ft.driverId = ds.driverId
        WHERE ds.position = 1
          AND r.year = ft.first_title_year
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
    """;

        List<Object[]> champions = entityManager.createNativeQuery(championInfoSql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : champions) {
            Long driverId = ((Number) row[0]).longValue();
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];

            String gpCountSql = """
            WITH first_title_year AS (
              SELECT MIN(r.year) AS year
              FROM driverstandings ds
              JOIN races r ON ds.raceId = r.raceId
              WHERE ds.driverId = :driverId
                AND ds.position = 1
                AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
            ),
            debut_year_round AS (
              SELECT MIN(r.year) AS year, MIN(r.round) AS round
              FROM results res
              JOIN races r ON res.raceId = r.raceId
              WHERE res.driverId = :driverId
            ),
            valid_races AS (
              SELECT r.year, r.round
              FROM races r
              WHERE (r.year > (SELECT year FROM debut_year_round) 
                     AND r.year < (SELECT year FROM first_title_year))
                 OR (r.year = (SELECT year FROM debut_year_round) AND r.round >= (SELECT round FROM debut_year_round))
                 OR (r.year = (SELECT year FROM first_title_year) AND r.round <= (
                    SELECT MAX(round) FROM races WHERE year = (SELECT year FROM first_title_year)
                 ))
            )
            SELECT COUNT(*) FROM (
              SELECT DISTINCT r.year, r.round
              FROM results res
              JOIN races r ON res.raceId = r.raceId
              WHERE res.driverId = :driverId
                AND (r.year, r.round) IN (SELECT year, round FROM valid_races)
            ) sub
        """;

            int gpCount = ((Number) entityManager.createNativeQuery(gpCountSql)
                    .setParameter("driverId", driverId)
                    .getSingleResult()).intValue();

            result.add(new DriverRankingDTO(name, nationality, gpCount, getFlagUrl(nationality)));
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue));
        return result;
    }












    private String getFlagUrl(String nationality) {
        String code = switch (nationality.toLowerCase().trim()) {
            case "argentine", "argentinian" -> "AR";
            case "australian" -> "AU";
            case "austrian" -> "AT";
            case "belgian" -> "BE";
            case "brazilian" -> "BR";
            case "british" -> "GB";
            case "canadian" -> "CA";
            case "chilean" -> "CL";
            case "chinese" -> "CN";
            case "colombian" -> "CO";
            case "czech" -> "CZ";
            case "danish" -> "DK";
            case "dutch" -> "NL";
            case "east german", "german" -> "DE";
            case "finnish" -> "FI";
            case "french" -> "FR";
            case "hungarian" -> "HU";
            case "indian" -> "IN";
            case "indonesian" -> "ID";
            case "irish" -> "IE";
            case "italian" -> "IT";
            case "japanese" -> "JP";
            case "liechtensteiner" -> "LI";
            case "malaysian" -> "MY";
            case "mexican" -> "MX";
            case "monegasque" -> "MC";
            case "new zealander" -> "NZ";
            case "polish" -> "PL";
            case "portuguese" -> "PT";
            case "rhodesian" -> "ZW"; // (histórico)
            case "russian" -> "RU";
            case "south african" -> "ZA";
            case "spanish" -> "ES";
            case "swedish" -> "SE";
            case "swiss" -> "CH";
            case "thai" -> "TH";
            case "uruguayan" -> "UY";
            case "venezuelan" -> "VE";
            case "american", "american-italian" -> "US";
            default -> "XX"; // Unknown
        };
        return "https://flagsapi.com/" + code + "/flat/24.png";
    }


    private String getTeamColor(String constructorRef) {
        return switch (constructorRef.toLowerCase()) {
            case "ferrari" -> "#dc0000";
            case "mercedes" -> "#00d2be";
            case "red_bull" -> "#1e41ff";
            case "rb" -> "#14394c";
            case "mclaren" -> "#ff8700";
            case "aston_martin" -> "#00665e";
            case "alpine" -> "#2293d1";
            case "williams" -> "#005aff";
            case "alpha_tauri", "alphatauri" -> "#2b4562";
            case "haas" -> "#b6babd";
            case "sauber", "stake", "alfa_romeo", "alfa" -> "#900000";
            case "renault" -> "#fff500";
            case "toro_rosso" -> "#0033a0";
            case "force_india" -> "#f596c8";
            case "lotus", "lotus_f1", "lotus_racing" -> "#027a36";
            case "caterham" -> "#004b33";
            case "manor", "marussia", "virgin" -> "#c70039";
            case "brawn" -> "#ffffff";
            case "jordan" -> "#ffd700";
            case "bmw_sauber", "bmw" -> "#1d1d5c";
            case "toyota" -> "#d40000";
            case "super_aguri" -> "#ed1c24";
            case "honda" -> "#d50000";
            case "spyker", "spyker_mf1" -> "#f75c03";
            case "mf1" -> "#999999";
            case "bar" -> "#00665e";
            case "minardi" -> "#3d3d3d";
            case "jaguar" -> "#007a3d";
            case "prost" -> "#0055a4";
            case "arrows" -> "#ff7f00";
            case "benetton" -> "#009878";
            case "stewart" -> "#004fa3";
            case "tyrrell" -> "#1a1aff";
            case "ligier" -> "#0000cc";
            case "forti" -> "#ffe600";
            case "footwork" -> "#e60000";
            case "pacific" -> "#0033cc";
            case "simtek" -> "#660066";
            case "team_lotus" -> "#003300";
            case "larrousse" -> "#000066";
            case "brabham" -> "#2b2bff";
            case "dallara" -> "#004b87";
            case "fondmetal" -> "#b22222";
            case "march" -> "#ee82ee";
            case "moda" -> "#ff6666";
            case "ags" -> "#ffcc00";
            case "lambo" -> "#00ff00";
            case "leyton" -> "#800000";
            case "coloni" -> "#999999";
            case "eurobrun" -> "#b03060";
            case "osella" -> "#0066cc";
            case "onyx" -> "#5e0080";
            case "life" -> "#7f0000";
            case "rial" -> "#0047ab";
            case "zakspeed" -> "#ff0000";
            case "ram" -> "#2f4f4f";
            case "spirit" -> "#1c1c1c";
            case "toleman" -> "#00008b";
            case "ats" -> "#ffcc00";
            case "theodore" -> "#c71585";
            case "fittipaldi" -> "#ffd700";
            case "ensign" -> "#000000";
            case "shadow" -> "#4b0082";
            case "wolf" -> "#000080";
            case "merzario" -> "#ffcccb";
            // Resto usarán gris por defecto
            default -> "#aaaaaa";
        };
    }
}
