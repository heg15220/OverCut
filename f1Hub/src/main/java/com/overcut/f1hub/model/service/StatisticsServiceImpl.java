package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.*;
import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
import com.overcut.f1hub.rest.dtos.CustomRankingDTO;
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
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.Temporal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StatisticsServiceImpl implements StatisticsService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private ConstructorDao constructorDao;

    @Autowired
    private DriverDao driverDao;

    @Autowired
    private ResultDao resultDao;

    @Autowired
    private RaceDao raceDao;

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
               (
                   SELECT c.constructorRef
                   FROM results r2
                   JOIN constructors c ON r2.constructorId = c.constructorId
                   WHERE r2.driverId = d.driverId AND r2.raceId = r.raceId AND r2.constructorId IS NOT NULL
                   LIMIT 1
               ) AS constructorRef,
               (
                   SELECT c.name
                   FROM results r2
                   JOIN constructors c ON r2.constructorId = c.constructorId
                   WHERE r2.driverId = d.driverId AND r2.raceId = r.raceId AND r2.constructorId IS NOT NULL
                   LIMIT 1
               ) AS constructorName,
               ds.points
        FROM driverstandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE r.year = :year
          AND r.round = (
              SELECT MAX(r2.round)
              FROM races r2
              WHERE r2.year = :year
          )
        ORDER BY ds.position ASC
    """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("year", year);

        List<Object[]> rows = query.getResultList();
        List<DriverStandingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String forename = (String) row[1];
            String surname = (String) row[2];
            String nationality = (String) row[3];
            String constructorRef = (String) row[4];
            String constructorName = (String) row[5];
            double totalPoints = ((Number) row[6]).doubleValue();

            String fullName = forename + " " + surname;
            String flagUrl = getFlagUrl(nationality);

            // Fallbacks seguros
            String safeConstructorName = constructorName != null ? constructorName : "—";
            String teamColor = constructorRef != null ? getTeamColor(constructorRef) : "#999999";

            result.add(new DriverStandingDTO(
                    fullName,
                    nationality,
                    safeConstructorName,
                    teamColor,
                    totalPoints,
                    flagUrl
            ));
        }

        return result;
    }








    @Override
    public List<ConstructorStandingDTO> getConstructorStandings(int year) {
        String sql = """
        SELECT c.constructorRef, c.name, cs.points
        FROM constructorstandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        JOIN races r ON cs.raceId = r.raceId
        WHERE r.year = :year
          AND r.round = (
            SELECT MAX(r2.round)
            FROM races r2
            WHERE r2.year = :year
          )
        ORDER BY cs.position ASC
    """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("year", year);

        List<Object[]> rows = query.getResultList();
        List<ConstructorStandingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String constructorRef = (String) row[0];
            String name = (String) row[1];
            double points = ((Number) row[2]).doubleValue();
            String teamColor = getTeamColor(constructorRef);

            result.add(new ConstructorStandingDTO(name, points, teamColor));
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

    @Override
    public List<DriverRankingDTO> getTitleCountByDriverAndConstructorVariety() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS team_names
        FROM driverstandings ds
        JOIN races r ON ds.raceId = r.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN results res ON res.raceId = ds.raceId AND res.driverId = ds.driverId
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE ds.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
        GROUP BY d.driverId
        ORDER BY COUNT(DISTINCT c.name) DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String fullName = row[1] + " " + row[2];
            String nationality = (String) row[3];
            String teams = (String) row[4];
            int teamCount = teams.split(",").length;

            result.add(new DriverRankingDTO(fullName, nationality, teamCount, getFlagUrl(nationality), teams));
        }

        return result;
    }



    @Override
    public List<DriverRankingDTO> getDriverWinsChronologically() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, MIN(r.date) AS first_win_date
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY res.driverId
        ORDER BY first_win_date ASC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            LocalDate date = ((Date) row[3]).toLocalDate();
            result.add(new DriverRankingDTO(name, nationality, date.getYear(), getFlagUrl(nationality), date.toString()));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getTeamWinsChronologically() {
        String sql = """
        SELECT c.name, c.nationality, MIN(r.date) AS first_win_date
        FROM results res
        JOIN constructors c ON res.constructorId = c.constructorId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY res.constructorId
        ORDER BY first_win_date ASC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = (String) row[0];
            String nationality = (String) row[1];
            LocalDate date = ((Date) row[2]).toLocalDate();
            result.add(new DriverRankingDTO(name, nationality, date.getYear(), getFlagUrl(nationality), date.toString()));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getYoungestDriversAtFirstWin() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, d.dob, MIN(r.date) AS win_date
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY res.driverId
        ORDER BY win_date ASC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            LocalDate dob = ((Date) row[3]).toLocalDate();
            LocalDate winDate = ((Date) row[4]).toLocalDate();
            int age = Period.between(dob, winDate).getYears();
            result.add(new DriverRankingDTO(name, nationality, age, getFlagUrl(nationality), winDate.toString()));
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue));
        return result;
    }



    @Override
    public List<DriverRankingDTO> getOldestDriversToWin() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, d.dob, r.date
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            LocalDate dob = ((Date) row[3]).toLocalDate();
            LocalDate winDate = ((Date) row[4]).toLocalDate();
            int age = Period.between(dob, winDate).getYears();
            result.add(new DriverRankingDTO(name, nationality, age, getFlagUrl(nationality), winDate.toString()));
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result;
    }

    @Override
    public List<DriverRankingDTO> getWinsOnBirthday() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, d.dob, r.date
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            LocalDate dob = ((Date) row[3]).toLocalDate();
            LocalDate winDate = ((Date) row[4]).toLocalDate();

            if (dob.getDayOfMonth() == winDate.getDayOfMonth() && dob.getMonth() == winDate.getMonth()) {
                result.add(new DriverRankingDTO(name, nationality, winDate.getYear(), getFlagUrl(nationality), winDate.toString()));
            }
        }

        result.sort(Comparator.comparing(DriverRankingDTO::getExtra)); // por fecha
        return result;
    }



    @Override
    public List<DriverRankingDTO> getLongestConsecutiveWinStreaks() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, r.year, r.round
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        ORDER BY d.driverId, r.year, r.round
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        Map<Long, String> driverNames = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();
        Map<Long, List<int[]>> winsByDriver = new HashMap<>(); // List of [year, round]

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int year = ((Number) row[4]).intValue();
            int round = ((Number) row[5]).intValue();

            driverNames.put(driverId, name);
            nationalities.put(driverId, nationality);
            winsByDriver.computeIfAbsent(driverId, k -> new ArrayList<>()).add(new int[]{year, round});
        }

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<int[]>> entry : winsByDriver.entrySet()) {
            Long driverId = entry.getKey();
            List<int[]> wins = entry.getValue();

            // Ordenar por año y ronda por seguridad
            wins.sort(Comparator.comparingInt((int[] arr) -> arr[0] * 1000 + arr[1]));

            int maxStreak = 1;
            int currentStreak = 1;

            for (int i = 1; i < wins.size(); i++) {
                int[] prev = wins.get(i - 1);
                int[] curr = wins.get(i);

                // Se consideran consecutivas si ocurren en rondas consecutivas dentro del mismo año
                // o si es la ronda 1 del siguiente año
                if ((curr[0] == prev[0] && curr[1] == prev[1] + 1) ||
                        (curr[0] == prev[0] + 1 && prev[1] >= 15 && curr[1] == 1)) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }

                maxStreak = Math.max(maxStreak, currentStreak);
            }

            result.add(new DriverRankingDTO(
                    driverNames.get(driverId),
                    nationalities.get(driverId),
                    maxStreak,
                    getFlagUrl(nationalities.get(driverId))
            ));
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result;
    }



    @Override
    public List<DriverRankingDTO> getLongestSeasonStartWinStreaks() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, r.year, r.round
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        ORDER BY d.driverId, r.year, r.round
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        Map<String, Integer> streaks = new HashMap<>(); // key: driverId_year
        Map<Long, Integer> bestStreakPerDriver = new HashMap<>(); // key: driverId
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        Set<String> processedRounds = new HashSet<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int year = ((Number) row[4]).intValue();
            int round = ((Number) row[5]).intValue();

            names.put(driverId, name);
            nationalities.put(driverId, nationality);

            String key = driverId + "_" + year;

            if (!processedRounds.contains(key + "_" + round)) {
                processedRounds.add(key + "_" + round);
                if (round == 1) {
                    streaks.put(key, 1);
                } else if (streaks.containsKey(key) && streaks.get(key) == round - 1) {
                    streaks.put(key, streaks.get(key) + 1);
                }
            }

            bestStreakPerDriver.merge(driverId, streaks.getOrDefault(key, 1), Math::max);
        }

        return bestStreakPerDriver.entrySet().stream()
                .map(e -> {
                    Long driverId = e.getKey();
                    String name = names.get(driverId);
                    String nationality = nationalities.get(driverId);
                    return new DriverRankingDTO(name, nationality, e.getValue(), getFlagUrl(nationality));
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getLastCareerWinPerDriver() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, MAX(r.date) AS last_win
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY res.driverId
        ORDER BY last_win DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int year = ((Date) row[3]).toLocalDate().getYear();
            String dateStr = ((Date) row[3]).toLocalDate().toString();
            return new DriverRankingDTO(name, nationality, year, getFlagUrl(nationality), dateStr);
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getBiggestGapBetweenWins() {
        String sql = """
        SELECT res.driverId, d.forename, d.surname, d.nationality, r.date
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        ORDER BY res.driverId, r.date
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        Map<Long, List<LocalDate>> winDatesByDriver = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            LocalDate date = ((Date) row[4]).toLocalDate();
            winDatesByDriver.computeIfAbsent(id, k -> new ArrayList<>()).add(date);
            names.put(id, row[1] + " " + row[2]);
            nationalities.put(id, (String) row[3]);
        }

        List<DriverRankingDTO> result = new ArrayList<>();
        for (Map.Entry<Long, List<LocalDate>> entry : winDatesByDriver.entrySet()) {
            List<LocalDate> dates = entry.getValue();
            if (dates.size() < 2) continue;

            long maxGap = 0;
            for (int i = 1; i < dates.size(); i++) {
                long gap = ChronoUnit.DAYS.between(dates.get(i - 1), dates.get(i));
                maxGap = Math.max(maxGap, gap);
            }

            result.add(new DriverRankingDTO(
                    names.get(entry.getKey()),
                    nationalities.get(entry.getKey()),
                    (int) maxGap,
                    getFlagUrl(nationalities.get(entry.getKey()))
            ));
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result;
    }



    @Override
    public List<DriverRankingDTO> getGapBetweenFirstAndLastWin() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, r.date
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        ORDER BY d.driverId, r.date
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        Map<Long, LocalDate> firstWin = new HashMap<>();
        Map<Long, LocalDate> lastWin = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            LocalDate date = ((Date) row[4]).toLocalDate();
            firstWin.putIfAbsent(id, date);
            lastWin.put(id, date);
            names.put(id, row[1] + " " + row[2]);
            nationalities.put(id, (String) row[3]);
        }

        return firstWin.entrySet().stream()
                .map(e -> {
                    LocalDate first = e.getValue();
                    LocalDate last = lastWin.get(e.getKey());
                    int gap = Period.between(first, last).getYears();
                    return new DriverRankingDTO(names.get(e.getKey()), nationalities.get(e.getKey()), gap, getFlagUrl(nationalities.get(e.getKey())));
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getMostWinsInSingleYear() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, r.year, COUNT(*) AS win_count
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY d.driverId, r.year
        ORDER BY win_count DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int year = ((Number) row[3]).intValue();
            int wins = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, wins, getFlagUrl(nationality), String.valueOf(year));
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getMostYearsWithWins() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(DISTINCT r.year) AS years_with_wins
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY d.driverId
        ORDER BY years_with_wins DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getMostConsecutiveWinningYears() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, r.year
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY d.driverId, r.year
        ORDER BY d.driverId, r.year
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        Map<Long, List<Integer>> yearsByDriver = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int year = ((Number) row[4]).intValue();
            yearsByDriver.computeIfAbsent(driverId, k -> new ArrayList<>()).add(year);
            names.put(driverId, row[1] + " " + row[2]);
            nationalities.put(driverId, (String) row[3]);
        }

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<Integer>> entry : yearsByDriver.entrySet()) {
            List<Integer> years = entry.getValue();
            years.sort(Integer::compare);
            int maxStreak = 1, current = 1;

            for (int i = 1; i < years.size(); i++) {
                if (years.get(i) == years.get(i - 1) + 1) {
                    current++;
                    maxStreak = Math.max(maxStreak, current);
                } else {
                    current = 1;
                }
            }

            result.add(new DriverRankingDTO(
                    names.get(entry.getKey()),
                    nationalities.get(entry.getKey()),
                    maxStreak,
                    getFlagUrl(nationalities.get(entry.getKey()))
            ));
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result;
    }


    @Override
    public List<DriverRankingDTO> getGpCountBeforeFirstWin() {
        String sql = """
    WITH first_win_dates AS (
        SELECT res.driverId, MIN(r.date) AS first_win
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY res.driverId
    )
    SELECT d.forename, d.surname, d.nationality, COUNT(*) AS races_before_win
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    JOIN drivers d ON res.driverId = d.driverId
    JOIN first_win_dates fwd ON res.driverId = fwd.driverId
    WHERE r.date < fwd.first_win
    GROUP BY res.driverId
    ORDER BY races_before_win DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }


    @Override
    public List<DriverRankingDTO> getDriversWithMostWinsSameConstructor() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, MAX(wins) AS max_wins
        FROM (
            SELECT r.driverId, r.constructorId, COUNT(*) AS wins
            FROM results r
            WHERE r.positionOrder = 1
            GROUP BY r.driverId, r.constructorId
        ) win_per_team
        JOIN drivers d ON d.driverId = win_per_team.driverId
        GROUP BY win_per_team.driverId
        ORDER BY max_wins DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getDriversWithMostConstructorsWithWins() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(DISTINCT r.constructorId) AS teams
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder = 1
        GROUP BY r.driverId
        ORDER BY teams DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getWinsByGrandPrix() {
        String sql = """
        SELECT r.name, COUNT(*) AS wins
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY r.name
        ORDER BY wins DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream()
                .map(row -> new DriverRankingDTO((String) row[0], "", ((Number) row[1]).intValue(), null))
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getConsecutiveWinsByGrandPrix() {
        List<DriverGpWinView> wins = resultDao.getAllDriverGpWins();

        Map<String, Integer> maxStreaks = new HashMap<>();
        Map<String, Integer> currentStreaks = new HashMap<>();

        String prevKey = null;
        Long prevDriverId = null;
        String prevRaceName = null;
        int prevYear = -1;

        for (DriverGpWinView win : wins) {
            String key = win.getDriverId() + "-" + win.getRaceName();

            if (key.equals(prevKey) && win.getYear() == prevYear + 1) {
                // Continua la racha
                int streak = currentStreaks.getOrDefault(key, 1) + 1;
                currentStreaks.put(key, streak);
                maxStreaks.put(key, Math.max(maxStreaks.getOrDefault(key, 1), streak));
            } else {
                // Nueva racha
                currentStreaks.put(key, 1);
                maxStreaks.put(key, Math.max(maxStreaks.getOrDefault(key, 1), 1));
            }

            prevKey = key;
            prevYear = win.getYear();
        }

        // Cargar pilotos en batch
        Set<Long> driverIds = maxStreaks.keySet().stream()
                .map(k -> Long.parseLong(k.split("-", 2)[0]))
                .collect(Collectors.toSet());

        Map<Long, Driver> drivers = driverDao.findByDriverIds(driverIds).stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return maxStreaks.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("-", 2);
                    Long driverId = Long.parseLong(parts[0]);
                    String gpName = parts[1];

                    Driver driver = drivers.get(driverId);
                    if (driver == null) return null;

                    String name = driver.getForename() + " " + driver.getSurname();
                    return new DriverRankingDTO(
                            name + " - " + gpName,
                            driver.getNationality(),
                            entry.getValue(),
                            getFlagUrl(driver.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithMostDifferentGPsWon() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(DISTINCT r.name) AS gps
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY d.driverId
        ORDER BY gps DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getDriversWithMostCircuitWins() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(*) AS wins
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        WHERE res.positionOrder = 1
        GROUP BY d.driverId, c.circuitId
        ORDER BY wins DESC
        LIMIT 50
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getDriversWithMostDifferentCircuitWins() {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(DISTINCT r.circuitId) AS unique_circuits
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY d.driverId
        ORDER BY unique_circuits DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }


    @Override
    public List<DriverRankingDTO> getWinsByStartingGridPosition() {
        String sql = """
    SELECT r.grid, COUNT(*)
    FROM results r
    WHERE r.positionOrder = 1 AND r.grid IS NOT NULL
    GROUP BY r.grid
    ORDER BY r.grid
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream()
                .map(row -> new DriverRankingDTO("P" + row[0], "", ((Number) row[1]).intValue(), ""))
                .toList();
    }

    @Override
    public List<DriverRankingDTO> getDriversWithMostGridPositionsWithWins() {
        String sql = """
    SELECT d.driverId, d.forename, d.surname, d.nationality, r.grid
    FROM results r
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1 AND r.grid IS NOT NULL
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        Map<Long, Set<Integer>> gridPositionsByDriver = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            int grid = ((Number) row[4]).intValue();
            gridPositionsByDriver.computeIfAbsent(id, k -> new HashSet<>()).add(grid);
            names.put(id, row[1] + " " + row[2]);
            nationalities.put(id, (String) row[3]);
        }

        return gridPositionsByDriver.entrySet().stream()
                .map(e -> new DriverRankingDTO(names.get(e.getKey()), nationalities.get(e.getKey()), e.getValue().size(), getFlagUrl(nationalities.get(e.getKey()))))
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }

    @Override
    public List<DriverRankingDTO> getDriversWithHomeGPWins() {
        String sql = """
    SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(*) AS wins
    FROM results r
    JOIN drivers d ON r.driverId = d.driverId
    JOIN races ra ON r.raceId = ra.raceId
    JOIN circuits c ON ra.circuitId = c.circuitId
    WHERE r.positionOrder = 1 AND LOWER(d.nationality) = LOWER(c.location)
    GROUP BY d.driverId
    ORDER BY wins DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int wins = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, wins, getFlagUrl(nationality));
        }).toList();
    }


    @Override
    public List<DriverRankingDTO> getWinsWithoutLeadingAnyLap() {
        String sql = """
    SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(*) AS wins
    FROM results r
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1 AND r.lapsLeading = 0
    GROUP BY d.driverId
    ORDER BY wins DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int wins = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, wins, getFlagUrl(nationality));
        }).toList();
    }


    @Override
    public List<DriverRankingDTO> getWinsWithoutPolePosition() {
        String sql = """
    SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(*)
    FROM results r
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1 AND r.grid > 1
    GROUP BY d.driverId
    ORDER BY COUNT(*) DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }

    @Override
    public List<DriverRankingDTO> getWinsWithFastestLap() {
        String sql = """
    SELECT d.driverId, d.forename, d.surname, d.nationality, COUNT(*)
    FROM results r
    JOIN drivers d ON r.driverId = d.driverId
    WHERE r.positionOrder = 1 AND r.fastestLap = 1
    GROUP BY d.driverId
    ORDER BY COUNT(*) DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> {
            String name = row[1] + " " + row[2];
            String nationality = (String) row[3];
            int count = ((Number) row[4]).intValue();
            return new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality));
        }).toList();
    }



    @Override
    public List<DriverRankingDTO> getSecondPlacePodiums() {
        return getPodiumsByPosition(2);
    }

    @Override
    public List<DriverRankingDTO> getThirdPlacePodiums() {
        return getPodiumsByPosition(3);
    }

    @Override
    public List<DriverRankingDTO> getSecondAndThirdPlacePodiums() {
        return getPodiumsByPosition(2, 3);
    }

    private List<DriverRankingDTO> getPodiumsByPosition(Integer... positions) {
        Set<Integer> pos = Set.of(positions);

        List<Object[]> rawCounts = resultDao.countPodiumsByPositions(pos);
        Map<Long, Integer> counts = rawCounts.stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).intValue()
                ));

        // Fetch drivers in batch (avoid N+1)
        List<Driver> drivers = driverDao.findByDriverIds(counts.keySet());

        return drivers.stream()
                .map(d -> new DriverRankingDTO(
                        d.getForename() + " " + d.getSurname(),
                        d.getNationality(),
                        counts.getOrDefault(d.getDriverId(), 0),
                        getFlagUrl(d.getNationality())
                ))
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getPodiumChronology() {
        List<Object[]> rows = resultDao.getFirstPodiumPerDriver();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        // Avoid N+1: fetch all drivers in batch
        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds).stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int year = ((Number) row[2]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            year,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue))
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getTeamPodiumChronology() {
        List<Object[]> rows = resultDao.getFirstPodiumPerConstructor();

        List<Long> constructorIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Constructor> constructorMap = constructorDao.findAllById(constructorIds)
                .stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long constructorId = ((Number) row[0]).longValue();
                    int year = ((Number) row[2]).intValue();
                    Constructor c = constructorMap.get(constructorId);
                    if (c == null) return null;
                    return new DriverRankingDTO(c.getName(), "–", year, null);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue))
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getYoungestPodiumDrivers() {
        List<Object[]> rows = resultDao.getYoungestPodiumDrivers();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int ageYears = (int) Math.floor(((Number) row[1]).doubleValue() / 365.25);
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            ageYears,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue))
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getPodiumsOnBirthday() {
        List<Object[]> rows = resultDao.countPodiumsOnBirthday();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getOldestPodiumDriversByNationality() {
        List<Object[]> rows = resultDao.getOldestPodiumDrivers();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int ageYears = (int) Math.floor(((Number) row[1]).doubleValue() / 365.25);
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            ageYears,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getLongestPodiumStreaks() {
        List<Object[]> rows = resultDao.getLongestPodiumStreaks();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int streak = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            streak,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getSeasonStartPodiumStreaks() {
        List<Object[]> rows = resultDao.getSeasonStartPodiumStreaks();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int streak = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            streak,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getLastPodiumPerDriver() {
        List<Object[]> rows = resultDao.getLastPodiumYearPerDriver();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int year = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            year,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getBiggestGapBetweenPodiums() {
        List<Object[]> rows = resultDao.getBiggestGapBetweenPodiums();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int gapDays = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            gapDays,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getGapBetweenFirstAndLastPodium() {
        List<Object[]> rows = resultDao.getGapBetweenFirstAndLastPodium();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int gapDays = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    // Convert days to years (approx)
                    int gapYears = (int) Math.floor(gapDays / 365.25);
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            gapYears,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getMostPodiumsInSingleYear() {
        List<Object[]> rows = resultDao.getMostPodiumsInSingleYear();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int year = ((Number) row[1]).intValue();
                    int count = ((Number) row[2]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname() + " (" + year + ")",
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }





    @Override
    public List<DriverRankingDTO> getPodiumYearsCount() {
        List<Object[]> rows = resultDao.getPodiumYearsCount();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int yearsCount = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            yearsCount,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getConsecutivePodiumYears() {
        List<Object[]> rows = resultDao.getConsecutivePodiumYears();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int streak = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            streak,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getGpCountBeforeFirstPodium() {
        List<Object[]> rows = resultDao.getGpCountBeforeFirstPodium();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int gpCount = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            gpCount,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getPodiumsBeforeFirstWin() {
        List<Object[]> rows = resultDao.getPodiumsBeforeFirstWin();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getPodiumsWithSingleConstructor() {
        List<Long> driverIds = resultDao.getDriversWithSingleConstructorPodiums();

        List<Driver> drivers = driverDao.findByDriverIds(driverIds);

        return drivers.stream()
                .map(d -> new DriverRankingDTO(
                        d.getForename() + " " + d.getSurname(),
                        d.getNationality(),
                        1,
                        getFlagUrl(d.getNationality())
                ))
                .sorted(Comparator.comparing(DriverRankingDTO::getDriverName))
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getPodiumsWithNoWins() {
        List<Object[]> rows = resultDao.getPodiumsWithNoWins();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int podiums = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            podiums,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getPodiumsWithMostConstructors() {
        List<Object[]> rows = resultDao.getPodiumsWithMostConstructors();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getPodiumsByGrandPrix() {
        List<Object[]> rows = resultDao.getPodiumsByGrandPrix();

        return rows.stream()
                .map(row -> {
                    String gpName = (String) row[0];
                    int count = ((Number) row[1]).intValue();
                    return new DriverRankingDTO(
                            gpName,
                            "",
                            count,
                            null
                    );
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithMostDifferentGPsWithPodium() {
        List<Object[]> rows = resultDao.getDriversWithMostDifferentGPsWithPodium();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithMostDifferentCircuitsWithPodium() {
        List<Object[]> rows = resultDao.getDriversWithMostDifferentCircuitsWithPodium();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getPodiumsAtHomeGP() {
        List<Object[]> rows = resultDao.getPodiumsAtHomeGP();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, Function.identity()));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getRepeatedIdenticalPodiums() {
        List<Object[]> rows = resultDao.getRepeatedIdenticalPodiums();

        return rows.stream()
                .map(row -> {
                    String combo = (String) row[0];
                    int repeats = ((Number) row[1]).intValue();
                    return new DriverRankingDTO(
                            combo, // driverName field
                            null,  // nationality
                            repeats,
                            null
                    );
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getMostFrequentPodiumTrios() {
        List<Object[]> rows = resultDao.getMostFrequentPodiumTrios();

        return rows.stream()
                .map(row -> {
                    String combo = (String) row[0];
                    int times = ((Number) row[1]).intValue();
                    return new DriverRankingDTO(
                            combo,
                            null,
                            times,
                            null
                    );
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getMostFrequentPodiumPairs() {
        List<Object[]> rows = resultDao.getMostFrequentPodiumPairs();

        return rows.stream()
                .map(row -> {
                    String pair = (String) row[0];
                    int times = ((Number) row[1]).intValue();
                    return new DriverRankingDTO(
                            pair,
                            null,
                            times,
                            null
                    );
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getMostCommonFirstSecondPairs() {
        List<Object[]> rows = resultDao.getMostCommonFirstSecondPairs();

        return rows.stream()
                .map(row -> {
                    String pair = (String) row[0];
                    int times = ((Number) row[1]).intValue();
                    return new DriverRankingDTO(
                            pair,
                            null,
                            times,
                            null
                    );
                })
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getDriversWithMostPoints() {
        String sql = """
        SELECT driverId, SUM(points) AS total
        FROM (
            SELECT driverId, points FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, points FROM sprintresults WHERE points > 0
        ) all_points
        GROUP BY driverId
        ORDER BY total DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int points = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            points,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
        public List<DriverRankingDTO> getDriversToScorePointsChronologically() {
            String sql = """
        SELECT p.driverId, MIN(r.date) AS firstDate
        FROM (
            SELECT driverId, raceId FROM results WHERE points > 0
            UNION
            SELECT driverId, raceId FROM sprintresults WHERE points > 0
        ) p
        JOIN races r ON p.raceId = r.raceId
        GROUP BY p.driverId
        ORDER BY firstDate
    """;

            List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

            List<Long> driverIds = rows.stream()
                    .map(r -> ((Number) r[0]).longValue())
                    .toList();

            Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                    .stream()
                    .collect(Collectors.toMap(Driver::getDriverId, d -> d));

            return rows.stream()
                    .map(row -> {
                        Long driverId = ((Number) row[0]).longValue();
                        Date date = (Date) row[1];
                        LocalDate localDate = date.toLocalDate();
                        Driver d = driverMap.get(driverId);
                        if (d == null) return null;
                        String name = d.getForename() + " " + d.getSurname();
                        String nationality = d.getNationality();
                        int year = localDate.getYear();
                        return new DriverRankingDTO(
                                name,
                                nationality,
                                year,
                                getFlagUrl(nationality),
                                localDate.toString()
                        );
                    })
                    .filter(Objects::nonNull)
                    .toList();
    }



    @Override
    public List<DriverRankingDTO> getLastPointsPerDriver() {
        String sql = """
        SELECT p.driverId, MAX(r.date) AS lastDate
        FROM (
            SELECT driverId, raceId FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, raceId FROM sprintresults WHERE points > 0
        ) p
        JOIN races r ON p.raceId = r.raceId
        GROUP BY p.driverId
        ORDER BY lastDate DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    Date date = (Date) row[1];
                    LocalDate localDate = date.toLocalDate();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    String name = d.getForename() + " " + d.getSurname();
                    String nationality = d.getNationality();
                    int year = localDate.getYear();
                    return new DriverRankingDTO(
                            name,
                            nationality,
                            year,
                            getFlagUrl(nationality),
                            localDate.toString()
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getYoungestDriversToScorePoints() {
        String sql = """
        SELECT p.driverId, MIN(r.date) AS firstPointsDate
        FROM (
            SELECT driverId, raceId FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, raceId FROM sprintresults WHERE points > 0
        ) p
        JOIN races r ON p.raceId = r.raceId
        GROUP BY p.driverId
        ORDER BY firstPointsDate
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    Date date = (Date) row[1];
                    LocalDate raceDate = date.toLocalDate();

                    Driver d = driverMap.get(driverId);
                    if (d == null || d.getDob() == null) return null;
                    LocalDate dob = d.getDob();
                    int age = Period.between(dob, raceDate).getYears();

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            age,
                            getFlagUrl(d.getNationality()),
                            raceDate.toString()
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue))
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getOldestDriversToScorePoints() {
        return getYoungestDriversToScorePoints()
                .stream()
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getLongestConsecutivePointsStreaks() {
        List<Object[]> rows = resultDao.getLongestConsecutivePointsStreaks();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int streak = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            streak,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getLongestConsecutivePointsStreaksWithoutSprints() {
        List<Object[]> rows = resultDao.getLongestConsecutivePointsStreaksWithoutSprints();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int streak = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            streak,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getLongestGapBetweenPoints() {
        List<Object[]> rows = resultDao.getLongestGapBetweenPoints();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int gap = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            gap,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getGapBetweenFirstAndLastPoints() {
        List<Object[]> rows = resultDao.getGapBetweenFirstAndLastPoints();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int days = ((Number) row[1]).intValue();
                    int yearsGap = (int) (days / 365.25);

                    Driver d = driverMap.get(driverId);
                    if (d == null || yearsGap <= 0) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            yearsGap,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getMostPointsInSingleYear() {
        String sql = """
        SELECT p.driverId, r.year, SUM(p.points) AS totalPoints
        FROM (
            SELECT driverId, raceId, points FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, raceId, points FROM sprintresults WHERE points > 0
        ) p
        JOIN races r ON p.raceId = r.raceId
        GROUP BY p.driverId, r.year
        ORDER BY totalPoints DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .distinct()
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int year = ((Number) row[1]).intValue();
                    int totalPoints = ((Number) row[2]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            totalPoints,
                            getFlagUrl(d.getNationality()),
                            String.valueOf(year)
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getMostYearsScoringPoints() {
        String sql = """
        SELECT p.driverId, COUNT(DISTINCT r.year) AS yearsCount
        FROM (
            SELECT driverId, raceId FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, raceId FROM sprintresults WHERE points > 0
        ) p
        JOIN races r ON p.raceId = r.raceId
        GROUP BY p.driverId
        ORDER BY yearsCount DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int years = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            years,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getMostConsecutiveSeasonsWithPoints() {
        List<Object[]> rows = resultDao.getMostConsecutiveSeasonsWithPoints();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int streak = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            streak,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithPointsButNoWins() {
        String sql = """
                    SELECT p.driverId, SUM(p.points) AS totalPoints
                    FROM (
                        SELECT driverId, points FROM results WHERE points > 0
                        UNION ALL
                        SELECT driverId, points FROM sprintresults WHERE points > 0
                    ) p
                    LEFT JOIN (
                        SELECT DISTINCT driverId FROM results WHERE positionOrder = 1
                        UNION
                        SELECT DISTINCT driverId FROM sprintresults WHERE positionOrder = 1
                    ) winners ON p.driverId = winners.driverId
                    WHERE winners.driverId IS NULL
                    GROUP BY p.driverId
                    ORDER BY totalPoints DESC            
                """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int totalPoints = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            totalPoints,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getDriversWithPointsButNoPodiums() {
        String sql = """
            SELECT p.driverId, SUM(p.points) AS totalPoints
                        FROM (
                            SELECT driverId, points FROM results WHERE points > 0
                            UNION ALL
                            SELECT driverId, points FROM sprintresults WHERE points > 0
                        ) p
                        LEFT JOIN (
                            SELECT DISTINCT driverId FROM results WHERE positionOrder <= 3
                            UNION
                            SELECT DISTINCT driverId FROM sprintresults WHERE positionOrder <= 3
                        ) podiums ON p.driverId = podiums.driverId
                        WHERE podiums.driverId IS NULL
                        GROUP BY p.driverId
                        ORDER BY totalPoints DESC
                        
                """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int totalPoints = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            totalPoints,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithMostConstructorsWithPoints() {
        String sql = """
        SELECT p.driverId, COUNT(DISTINCT p.constructorId) AS team_count
        FROM (
            SELECT driverId, constructorId FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, constructorId FROM sprintresults WHERE points > 0
        ) p
        GROUP BY p.driverId
        ORDER BY team_count DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int teamCount = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            teamCount,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getYoungestDriversToScorePointsByNationality() {
        String sql = """
        SELECT p.driverId, MIN(r.date) AS firstPointsDate
        FROM (
            SELECT driverId, raceId FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, raceId FROM sprintresults WHERE points > 0
        ) p
        JOIN races r ON p.raceId = r.raceId
        GROUP BY p.driverId
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Agrupar por nacionalidad y elegir más joven
        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    Date date = (Date) row[1];
                    LocalDate raceDate = date.toLocalDate();

                    Driver d = driverMap.get(driverId);
                    if (d == null || d.getDob() == null || d.getNationality() == null) return null;

                    int age = Period.between(d.getDob(), raceDate).getYears();

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            age,
                            getFlagUrl(d.getNationality()),
                            raceDate.toString()
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(
                        DriverRankingDTO::getNationality,
                        Collectors.collectingAndThen(
                                Collectors.minBy(Comparator.comparingInt(DriverRankingDTO::getValue)),
                                Optional::get
                        )
                ))
                .values().stream()
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue))
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getOldestDriversToScorePointsByNationality() {
        String sql = """
        SELECT p.driverId, MIN(r.date) AS firstPointsDate
        FROM (
            SELECT driverId, raceId FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, raceId FROM sprintresults WHERE points > 0
        ) p
        JOIN races r ON p.raceId = r.raceId
        GROUP BY p.driverId
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Agrupar por nacionalidad y elegir más viejo
        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    Date date = (Date) row[1];
                    LocalDate raceDate = date.toLocalDate();

                    Driver d = driverMap.get(driverId);
                    if (d == null || d.getDob() == null || d.getNationality() == null) return null;

                    int age = Period.between(d.getDob(), raceDate).getYears();

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            age,
                            getFlagUrl(d.getNationality()),
                            raceDate.toString()
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(
                        DriverRankingDTO::getNationality,
                        Collectors.collectingAndThen(
                                Collectors.maxBy(Comparator.comparingInt(DriverRankingDTO::getValue)),
                                Optional::get
                        )
                ))
                .values().stream()
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getGpCountBeforeFirstPoints() {
        String sql = """
        WITH first_points AS (
            SELECT p.driverId, MIN(r.date) AS firstPointsDate
            FROM (
                SELECT driverId, raceId FROM results WHERE points > 0
                UNION ALL
                SELECT driverId, raceId FROM sprintresults WHERE points > 0
            ) p
            JOIN races r ON p.raceId = r.raceId
            GROUP BY p.driverId
        )
        SELECT res.driverId, COUNT(*) AS gpCount
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN first_points fp ON res.driverId = fp.driverId
        WHERE r.date < fp.firstPointsDate
        GROUP BY res.driverId
        ORDER BY gpCount DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getGpCountWhereDriverScoredPoints() {
        String sql = """
        SELECT p.driverId, COUNT(DISTINCT p.raceId) AS scored_races
        FROM (
            SELECT driverId, raceId FROM results WHERE points > 0
            UNION ALL
            SELECT driverId, raceId FROM sprintresults WHERE points > 0
        ) p
        GROUP BY p.driverId
        ORDER BY scored_races DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds de los resultados
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        // Fetch en batch de los drivers
        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Construir DTOs
        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithMostGrandsPrix() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, COUNT(DISTINCT r.raceId) AS gps
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            GROUP BY d.driverId
            ORDER BY gps DESC
        """;
        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(mapRowToDriverRanking(row));
        }
        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverGpDebutChronology() {
        String sql = """
        SELECT res.driverId, YEAR(MIN(r.date)) AS debut_year
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        GROUP BY res.driverId
        ORDER BY MIN(r.date) DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds únicos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Armar el resultado
        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int debutYear = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            debutYear,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getGpDebutChronologyByConstructor() {
        String sql = """
        SELECT c.name, c.nationality, YEAR(MIN(r.date)) AS debut_year
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN constructors c ON res.constructorId = c.constructorId
        GROUP BY c.constructorId
        ORDER BY debut_year ASC
    """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String constructorName = (String) row[0];
            String nationality = (String) row[1];
            int debutYear = ((Number) row[2]).intValue();

            result.add(new DriverRankingDTO(
                    constructorName,         // driverName → aquí usamos el nombre del constructor
                    nationality,
                    debutYear,               // value → año de debut
                    getFlagUrl(nationality),
                    null                     // extra → sin usar en este caso
            ));
        }

        return result;
    }



    @Override
    public List<DriverRankingDTO> getBiggestGapBetweenGrandsPrix() {
        String sql = """
            SELECT
                    d.forename,
                    d.surname,
                    d.nationality,
                    DATEDIFF(t.last_date, t.first_date) AS gap_days
                FROM (
                    SELECT res.driverId, MIN(r.date) AS first_date, MAX(r.date) AS last_date
                    FROM results res
                    JOIN races r ON res.raceId = r.raceId
                    GROUP BY res.driverId
                    HAVING first_date IS NOT NULL AND last_date IS NOT NULL AND first_date <> last_date
                ) t
                JOIN drivers d ON t.driverId = d.driverId
                ORDER BY gap_days DESC                    
                """;
        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(mapRowToDriverRanking(row));
        }
        return result;
    }




    @Override
    public List<DriverRankingDTO> getGapBetweenFirstAndLastGp() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality,
               TIMESTAMPDIFF(YEAR, MIN(r.date), MAX(r.date)) AS gap_years
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        GROUP BY d.driverId
        HAVING gap_years > 0
        ORDER BY gap_years DESC
    """;
        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(mapRowToDriverRanking(row));
        }
        return result;
    }


    @Override
    public List<DriverRankingDTO> getLongestGpStreaks() {
        String sql = """
        SELECT res.driverId, r.year, r.round
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        ORDER BY res.driverId, r.date
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds únicos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .distinct()
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // La lógica del streak se mantiene igual
        class Streak {
            Long driverId;
            int maxStreak = 1;
            int currentStreak = 1;
            int lastYear = -1;
            int lastRound = -1;
        }

        List<DriverRankingDTO> result = new ArrayList<>();
        Long currentDriverId = null;
        Streak streak = null;

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int year = ((Number) row[1]).intValue();
            int round = ((Number) row[2]).intValue();

            if (!driverId.equals(currentDriverId)) {
                if (streak != null && driverMap.containsKey(streak.driverId)) {
                    Driver d = driverMap.get(streak.driverId);
                    result.add(new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            streak.maxStreak,
                            getFlagUrl(d.getNationality())
                    ));
                }
                streak = new Streak();
                streak.driverId = driverId;
                currentDriverId = driverId;
                streak.lastYear = year;
                streak.lastRound = round;
                continue;
            }

            if ((year == streak.lastYear && round == streak.lastRound + 1) ||
                    (year == streak.lastYear + 1 && round == 1 && streak.lastRound > 15)) {
                streak.currentStreak++;
                streak.maxStreak = Math.max(streak.maxStreak, streak.currentStreak);
            } else {
                streak.currentStreak = 1;
            }

            streak.lastYear = year;
            streak.lastRound = round;
        }

        // Add last streak
        if (streak != null && driverMap.containsKey(streak.driverId)) {
            Driver d = driverMap.get(streak.driverId);
            result.add(new DriverRankingDTO(
                    d.getForename() + " " + d.getSurname(),
                    d.getNationality(),
                    streak.maxStreak,
                    getFlagUrl(d.getNationality())
            ));
        }

        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result;
    }




    @Override
    public List<DriverRankingDTO> getDriversByTotalLapsCompleted() {
        String sql = """
        SELECT r.driverId, SUM(r.laps) AS total_laps
        FROM results r
        GROUP BY r.driverId
        ORDER BY total_laps DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds únicos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int totalLaps = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            totalLaps,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getDriversWithGpsWithWorldChampions() {
        String sql = """
        SELECT r1.driverId, COUNT(DISTINCT r1.raceId) AS count
        FROM results r1
        JOIN results r2 ON r1.raceId = r2.raceId AND r2.driverId != r1.driverId
        JOIN driverstandings ds ON r2.driverId = ds.driverId AND r2.raceId = ds.raceId AND ds.position = 1
        GROUP BY r1.driverId
        ORDER BY count DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds únicos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getDriversWithGpsWithRaceWinner() {
        String sql = """
        SELECT r1.driverId, COUNT(DISTINCT r1.raceId) AS count
        FROM results r1
        JOIN results r2 ON r1.raceId = r2.raceId AND r2.driverId != r1.driverId AND r2.positionOrder = 1
        GROUP BY r1.driverId
        ORDER BY count DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds únicos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithSameConstructor() {
        String sql = """
        SELECT sub.driverId, MAX(sub.cnt) AS max_with_same_constructor
        FROM (
            SELECT r.driverId, r.constructorId, COUNT(*) AS cnt
            FROM results r
            GROUP BY r.driverId, r.constructorId
        ) AS sub
        GROUP BY sub.driverId
        ORDER BY max_with_same_constructor DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds únicos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int maxWithSameConstructor = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            maxWithSameConstructor,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getDriversWithMostConstructorsInGps() {
        String sql = """
        SELECT r.driverId, COUNT(DISTINCT r.constructorId) AS constructors
        FROM results r
        GROUP BY r.driverId
        ORDER BY constructors DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los driverIds únicos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int constructorCount = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            constructorCount,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithSameEngine() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, MAX(cnt) AS max_with_same_engine
            FROM (
                SELECT r.driverId, c.engineId, COUNT(*) AS cnt
                FROM results r
                JOIN constructors c ON r.constructorId = c.constructorId
                GROUP BY r.driverId, c.engineId
            ) AS sub
            JOIN drivers d ON d.driverId = sub.driverId
            GROUP BY sub.driverId
            ORDER BY max_with_same_engine DESC
        """;
        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();
        for (Object[] row : rows) result.add(mapRowToDriverRanking(row));
        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriversWithMostEnginesInGps() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, COUNT(DISTINCT c.engineId) AS engine_count
            FROM results r
            JOIN constructors c ON r.constructorId = c.constructorId
            JOIN drivers d ON r.driverId = d.driverId
            GROUP BY r.driverId
            ORDER BY engine_count DESC
        """;
        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();
        for (Object[] row : rows) result.add(mapRowToDriverRanking(row));
        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithSameTeammate() {
        String sql = """
                SELECT driverId, MAX(gp_count) AS max_teammate_gp
                FROM (
                    SELECT driverA AS driverId, COUNT(*) AS gp_count
                    FROM (
                        SELECT LEAST(r1.driverId, r2.driverId) AS driverA,
                               GREATEST(r1.driverId, r2.driverId) AS driverB
                        FROM results r1
                        JOIN results r2
                          ON r1.raceId = r2.raceId
                         AND r1.constructorId = r2.constructorId
                         AND r1.driverId < r2.driverId
                    ) AS pairs
                    GROUP BY driverA, driverB
                            
                    UNION ALL
                            
                    SELECT driverB AS driverId, COUNT(*) AS gp_count
                    FROM (
                        SELECT LEAST(r1.driverId, r2.driverId) AS driverA,
                               GREATEST(r1.driverId, r2.driverId) AS driverB
                        FROM results r1
                        JOIN results r2
                          ON r1.raceId = r2.raceId
                         AND r1.constructorId = r2.constructorId
                         AND r1.driverId < r2.driverId
                    ) AS pairs
                    GROUP BY driverA, driverB
                ) AS all_counts
                GROUP BY driverId
                ORDER BY max_teammate_gp DESC
                                                         
                """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();
                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;
                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getDriversGpAgeByNationality() {
        String sql = """
            SELECT
                t.driverId,
                TIMESTAMPDIFF(YEAR, d.dob, t.first_race_date) AS age
            FROM (
                SELECT res.driverId, MIN(r.date) AS first_race_date
                FROM results res
                JOIN races r ON res.raceId = r.raceId
                WHERE r.date IS NOT NULL
                GROUP BY res.driverId
            ) AS t
            JOIN drivers d ON t.driverId = d.driverId
            WHERE d.dob IS NOT NULL
            ORDER BY age
        """;


        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int age = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            age,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getOldestDriversAtGp() {
        String sql = """
        SELECT
            res.driverId,
            TIMESTAMPDIFF(YEAR, d.dob, MAX(r.date)) AS max_age
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE r.date IS NOT NULL AND d.dob IS NOT NULL
        GROUP BY res.driverId
        ORDER BY max_age DESC
    """;


        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int age = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            age,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getAverageDriverAgePerGp() {
        String sql = """
        WITH driver_ages AS (
            SELECT
                res.driverId,
                TIMESTAMPDIFF(YEAR, d.dob, r.date) AS age
            FROM results res
            JOIN drivers d ON res.driverId = d.driverId
            JOIN races r ON res.raceId = r.raceId
            WHERE r.date IS NOT NULL AND d.dob IS NOT NULL
        )
        SELECT driverId, ROUND(AVG(age)) AS avg_age
        FROM driver_ages
        GROUP BY driverId
        ORDER BY avg_age
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int avgAge = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            avgAge,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutWin() {
        String sql = """
         WITH
          debut AS (
            SELECT res.driverId, MIN(r.date) AS debut_date
            FROM results res
            JOIN races r ON res.raceId = r.raceId
            GROUP BY res.driverId
          ),
          last_race AS (
            SELECT res.driverId, MAX(r.date) AS last_race_date
            FROM results res
            JOIN races r ON res.raceId = r.raceId
            GROUP BY res.driverId
          ),
          last_win AS (
            SELECT res.driverId, MAX(r.date) AS last_win_date
            FROM results res
            JOIN races r ON res.raceId = r.raceId
            WHERE res.positionOrder = 1
            GROUP BY res.driverId
          ),
          reference AS (
            SELECT
              lr.driverId,
              lr.last_race_date,
              COALESCE(lw.last_win_date, d.debut_date) AS reference_date
            FROM last_race lr
            JOIN debut d ON lr.driverId = d.driverId
            LEFT JOIN last_win lw ON lr.driverId = lw.driverId
          )
        SELECT
          ref.driverId,
          COUNT(DISTINCT res.raceId) AS drought_count
        FROM reference ref
        JOIN results res ON res.driverId = ref.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE r.date BETWEEN ref.reference_date AND ref.last_race_date
        GROUP BY ref.driverId
        ORDER BY drought_count DESC

                """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int droughtCount = ((Number) row[1]).intValue();

            Driver d = driverMap.get(driverId);
            if (d == null) continue;

            result.add(new DriverRankingDTO(
                    d.getForename() + " " + d.getSurname(),
                    d.getNationality(),
                    droughtCount,
                    getFlagUrl(d.getNationality())
            ));
        }


        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result.stream().limit(30).toList();
    }




    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutPole() {
        String sql = """
                    WITH
                     debut AS (
                       SELECT res.driverId, MIN(r.date) AS debut_date
                       FROM results res
                       JOIN races r ON res.raceId = r.raceId
                       GROUP BY res.driverId
                     ),
                     last_race AS (
                       SELECT res.driverId, MAX(r.date) AS last_race_date
                       FROM results res
                       JOIN races r ON res.raceId = r.raceId
                       GROUP BY res.driverId
                     ),
                     last_pole AS (
                       SELECT q.driverId, MAX(r.date) AS last_pole_date
                       FROM qualifying q
                       JOIN races r ON q.raceId = r.raceId
                       WHERE q.position = 1
                       GROUP BY q.driverId
                     ),
                     reference AS (
                       SELECT
                         lr.driverId,
                         lr.last_race_date,
                         COALESCE(lp.last_pole_date, d.debut_date) AS reference_date
                       FROM last_race lr
                       JOIN debut d ON lr.driverId = d.driverId
                       LEFT JOIN last_pole lp ON lr.driverId = lp.driverId
                     )
                   SELECT
                     ref.driverId,
                     COUNT(DISTINCT res.raceId) AS drought_count
                   FROM reference ref
                   JOIN results res ON res.driverId = ref.driverId
                   JOIN races r ON res.raceId = r.raceId
                   WHERE r.date BETWEEN ref.reference_date AND ref.last_race_date
                   GROUP BY ref.driverId
                   ORDER BY drought_count DESC
                   
                """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int droughtCount = ((Number) row[1]).intValue();

            Driver d = driverMap.get(driverId);
            if (d == null) continue;

            result.add(new DriverRankingDTO(
                    d.getForename() + " " + d.getSurname(),
                    d.getNationality(),
                    droughtCount,
                    getFlagUrl(d.getNationality())
            ));
        }


        result.sort(Comparator.comparingInt(DriverRankingDTO::getValue).reversed());
        return result.stream().limit(30).toList();
    }




    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutFastestLap() {
        String sql = """
                WITH
                  debut AS (
                    SELECT res.driverId, MIN(r.date) AS debut_date
                    FROM results res
                    JOIN races r ON res.raceId = r.raceId
                    GROUP BY res.driverId
                  ),
                  last_race AS (
                    SELECT res.driverId, MAX(r.date) AS last_race_date
                    FROM results res
                    JOIN races r ON res.raceId = r.raceId
                    GROUP BY res.driverId
                  ),
                  fastest_lap_winners AS (
                    SELECT driverId, raceId, race_date FROM (
                        SELECT
                            res.driverId,
                            res.raceId,
                            ra.date AS race_date,
                            ROW_NUMBER() OVER (PARTITION BY res.raceId ORDER BY res.fastestLapTime ASC) AS rn
                        FROM results res
                        JOIN races ra ON res.raceId = ra.raceId
                        WHERE res.fastestLapTime IS NOT NULL
                    ) ranked
                    WHERE ranked.rn = 1
                  ),
                         
                  last_fastest AS (
                    SELECT driverId, MAX(race_date) AS last_fastest_date
                    FROM fastest_lap_winners
                    GROUP BY driverId
                  ),
                  reference AS (
                    SELECT
                      lr.driverId,
                      COALESCE(lf.last_fastest_date, d.debut_date) AS reference_date,
                      lr.last_race_date
                    FROM last_race lr
                    JOIN debut d ON lr.driverId = d.driverId
                    LEFT JOIN last_fastest lf ON lr.driverId = lf.driverId
                  )
                SELECT
                  ref.driverId,
                  COUNT(DISTINCT res.raceId) AS drought_count
                FROM reference ref
                JOIN results res ON res.driverId = ref.driverId
                JOIN races r ON res.raceId = r.raceId
                WHERE r.date BETWEEN ref.reference_date AND ref.last_race_date
                GROUP BY ref.driverId
                ORDER BY drought_count DESC
                """;

        // Ejecutar la consulta
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener los IDs de pilotos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        // Mapear los Driver desde la base
        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Generar el resultado
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int droughtCount = ((Number) row[1]).intValue();

            Driver d = driverMap.get(driverId);
            if (d == null) continue;

            result.add(new DriverRankingDTO(
                    d.getForename() + " " + d.getSurname(),
                    d.getNationality(),
                    droughtCount,
                    getFlagUrl(d.getNationality())
            ));
        }

        return result.stream()
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .limit(30)
                .toList();
    }




    private int countGpsBetweenDates(Long driverId, LocalDate from, LocalDate to) {
        String sql = """
        SELECT COUNT(DISTINCT r.raceId)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.driverId = :driverId
        AND r.date BETWEEN :fromDate AND :toDate
    """;
        Query q = entityManager.createNativeQuery(sql);
        q.setParameter("driverId", driverId);
        q.setParameter("fromDate", Date.valueOf(from));
        q.setParameter("toDate", Date.valueOf(to));
        return ((Number) q.getSingleResult()).intValue();
    }

    private LocalDate getDebutDate(Long driverId) {
        String sql = """
        SELECT MIN(r.date)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        WHERE res.driverId = :driverId
    """;
        Query q = entityManager.createNativeQuery(sql);
        q.setParameter("driverId", driverId);
        return ((Date) q.getSingleResult()).toLocalDate();
    }



    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutPoints() {
        String sql = """
        SELECT r.driverId, COUNT(DISTINCT r.raceId) AS gps_without_points
        FROM results r
        WHERE (r.points IS NULL OR r.points = 0)
        GROUP BY r.driverId
        ORDER BY gps_without_points DESC
        LIMIT 200
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int count = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            count,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }




    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutPodium() {
        String sql = """
        WITH
            debut AS (
                SELECT res.driverId, MIN(r.date) AS debut_date
                FROM results res
                JOIN races r ON res.raceId = r.raceId
                GROUP BY res.driverId
            ),
            last_race AS (
                SELECT res.driverId, MAX(r.date) AS last_race_date
                FROM results res
                JOIN races r ON res.raceId = r.raceId
                GROUP BY res.driverId
            ),
            last_podium AS (
                SELECT res.driverId, MAX(r.date) AS last_podium_date
                FROM results res
                JOIN races r ON res.raceId = r.raceId
                WHERE res.positionOrder <= 3
                GROUP BY res.driverId
            ),
            reference AS (
                SELECT
                    lr.driverId,
                    COALESCE(lp.last_podium_date, d.debut_date) AS reference_date,
                    lr.last_race_date
                FROM last_race lr
                JOIN debut d ON lr.driverId = d.driverId
                LEFT JOIN last_podium lp ON lr.driverId = lp.driverId
            )
        SELECT
            ref.driverId,
            COUNT(DISTINCT res.raceId) AS drought_count
        FROM reference ref
        JOIN results res ON res.driverId = ref.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE r.date BETWEEN ref.reference_date AND ref.last_race_date
        GROUP BY ref.driverId
        ORDER BY drought_count DESC
        """;

        // Ejecutar la consulta
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        // Obtener todos los IDs de pilotos
        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        // Traer los Driver completos en un solo query
        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Mapear resultados a DTOs
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int droughtCount = ((Number) row[1]).intValue();

            Driver d = driverMap.get(driverId);
            if (d == null) continue;

            result.add(new DriverRankingDTO(
                    d.getForename() + " " + d.getSurname(),
                    d.getNationality(),
                    droughtCount,
                    getFlagUrl(d.getNationality())
            ));
        }

        return result.stream()
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .limit(30)
                .toList();
    }





    @Override
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutLeadingLap() {
        String sql = """
        WITH
          debut AS (
            SELECT res.driverId, MIN(r.date) AS debut_date
            FROM results res
            JOIN races r ON res.raceId = r.raceId
            GROUP BY res.driverId
          ),
          last_race AS (
            SELECT res.driverId, MAX(r.date) AS last_race_date
            FROM results res
            JOIN races r ON res.raceId = r.raceId
            GROUP BY res.driverId
          ),
          last_led_lap AS (
            SELECT lt.driverId, MAX(r2.date) AS last_led_lap_date
            FROM laptimes lt
            JOIN races r2 ON lt.raceId = r2.raceId
            WHERE lt.position = 1
            GROUP BY lt.driverId
          ),
          reference AS (
            SELECT
              lr.driverId,
              COALESCE(ll.last_led_lap_date, d.debut_date) AS reference_date,
              lr.last_race_date
            FROM last_race lr
            JOIN debut d ON lr.driverId = d.driverId
            LEFT JOIN last_led_lap ll ON lr.driverId = ll.driverId
          )
        SELECT
          ref.driverId,
          COUNT(DISTINCT res.raceId) AS drought_count
        FROM reference ref
        JOIN results res ON res.driverId = ref.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE r.date BETWEEN ref.reference_date AND ref.last_race_date
        GROUP BY ref.driverId
        ORDER BY drought_count DESC
        """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int droughtCount = ((Number) row[1]).intValue();

            Driver d = driverMap.get(driverId);
            if (d == null) continue;

            result.add(new DriverRankingDTO(
                    d.getForename() + " " + d.getSurname(),
                    d.getNationality(),
                    droughtCount,
                    getFlagUrl(d.getNationality())
            ));
        }

        return result.stream()
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .limit(30)
                .toList();
    }





    @Override
    public List<DriverRankingDTO> getDriversWithGpsWithoutWinPoleOrFastestLap() {
        String sql = """
                WITH
                  debut AS (
                    SELECT res.driverId, MIN(r.date) AS debut_date
                    FROM results res
                    JOIN races r ON res.raceId = r.raceId
                    GROUP BY res.driverId
                  ),
                  last_race AS (
                    SELECT res.driverId, MAX(r.date) AS last_race_date
                    FROM results res
                    JOIN races r ON res.raceId = r.raceId
                    GROUP BY res.driverId
                  ),
                  last_win AS (
                    SELECT res.driverId, MAX(r.date) AS last_win_date
                    FROM results res
                    JOIN races r ON res.raceId = r.raceId
                    WHERE res.positionOrder = 1
                    GROUP BY res.driverId
                  ),
                  last_pole AS (
                    SELECT q.driverId, MAX(r.date) AS last_pole_date
                    FROM qualifying q
                    JOIN races r ON q.raceId = r.raceId
                    WHERE q.position = 1
                    GROUP BY q.driverId
                  ),
                  fastest_lap_winners AS (
                    SELECT driverId, raceId, race_date FROM (
                        SELECT
                            res.driverId,
                            res.raceId,
                            ra.date AS race_date,
                            ROW_NUMBER() OVER (PARTITION BY res.raceId ORDER BY res.fastestLapTime ASC) AS rn
                        FROM results res
                        JOIN races ra ON res.raceId = ra.raceId
                        WHERE res.fastestLapTime IS NOT NULL
                    ) ranked
                    WHERE ranked.rn = 1
                  ),
                  last_fastest AS (
                    SELECT driverId, MAX(race_date) AS last_fastest_date
                    FROM fastest_lap_winners
                    GROUP BY driverId
                  ),
                  last_achievement AS (
                    SELECT lw.driverId, GREATEST(
                        COALESCE(lw.last_win_date, '1000-01-01'),
                        COALESCE(lp.last_pole_date, '1000-01-01'),
                        COALESCE(lf.last_fastest_date, '1000-01-01')
                    ) AS last_achievement_date
                    FROM last_win lw
                    LEFT JOIN last_pole lp ON lw.driverId = lp.driverId
                    LEFT JOIN last_fastest lf ON lw.driverId = lf.driverId
                  ),
                  reference AS (
                    SELECT
                      lr.driverId,
                      COALESCE(la.last_achievement_date, d.debut_date) AS reference_date,
                      lr.last_race_date
                    FROM last_race lr
                    JOIN debut d ON lr.driverId = d.driverId
                    LEFT JOIN last_achievement la ON lr.driverId = la.driverId
                  )
                SELECT
                  ref.driverId,
                  COUNT(DISTINCT res.raceId) AS drought_count
                FROM reference ref
                JOIN results res ON res.driverId = ref.driverId
                JOIN races r ON res.raceId = r.raceId
                WHERE r.date BETWEEN ref.reference_date AND ref.last_race_date
                GROUP BY ref.driverId
                ORDER BY drought_count DESC
                """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int droughtCount = ((Number) row[1]).intValue();

            Driver d = driverMap.get(driverId);
            if (d == null) continue;

            result.add(new DriverRankingDTO(
                    d.getForename() + " " + d.getSurname(),
                    d.getNationality(),
                    droughtCount,
                    getFlagUrl(d.getNationality())
            ));
        }

        return result.stream()
                .sorted(Comparator.comparingInt(DriverRankingDTO::getValue).reversed())
                .limit(30)
                .toList();
    }





    @Override
    public List<DriverRankingDTO> getDriversWithMostSeasons() {
        String sql = """
        SELECT res.driverId, COUNT(DISTINCT r.year) AS seasons
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        GROUP BY res.driverId
        ORDER BY seasons DESC
    """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Long> driverIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(driverIds)
                .stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        return rows.stream()
                .map(row -> {
                    Long driverId = ((Number) row[0]).longValue();
                    int seasons = ((Number) row[1]).intValue();

                    Driver d = driverMap.get(driverId);
                    if (d == null) return null;

                    return new DriverRankingDTO(
                            d.getForename() + " " + d.getSurname(),
                            d.getNationality(),
                            seasons,
                            getFlagUrl(d.getNationality())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }


    @Override
    public List<DriverRankingDTO> getDriversWithMostConsecutiveSeasons() {
        String sql = """
            SELECT res.driverId, r.year, d.forename, d.surname, d.nationality
            FROM results res
            JOIN races r ON res.raceId = r.raceId
            JOIN drivers d ON res.driverId = d.driverId
            GROUP BY res.driverId, r.year
            ORDER BY res.driverId, r.year
        """;
        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();

        class Streak {
            String forename;
            String surname;
            String nationality;
            int maxStreak = 1;
            int currentStreak = 1;
            int lastYear = -1;
        }

        List<DriverRankingDTO> result = new ArrayList<>();
        Long currentDriverId = null;
        Streak streak = null;

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            int year = ((Number) row[1]).intValue();
            String forename = (String) row[2];
            String surname = (String) row[3];
            String nationality = (String) row[4];

            if (!driverId.equals(currentDriverId)) {
                if (streak != null) {
                    result.add(new DriverRankingDTO(
                            streak.forename + " " + streak.surname,
                            streak.nationality,
                            streak.maxStreak,
                            getFlagUrl(streak.nationality)));
                }
                streak = new Streak();
                streak.forename = forename;
                streak.surname = surname;
                streak.nationality = nationality;
                streak.lastYear = year;
                currentDriverId = driverId;
                continue;
            }

            if (year == streak.lastYear + 1) {
                streak.currentStreak++;
                streak.maxStreak = Math.max(streak.maxStreak, streak.currentStreak);
            } else {
                streak.currentStreak = 1;
            }

            streak.lastYear = year;
        }

        if (streak != null) {
            result.add(new DriverRankingDTO(
                    streak.forename + " " + streak.surname,
                    streak.nationality,
                    streak.maxStreak,
                    getFlagUrl(streak.nationality)));
        }

        result.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriverSeasonCount() {
        String sql = """
        WITH driver_years AS (
            SELECT DISTINCT res.driverId, r.year
            FROM results res
            JOIN races r ON res.raceId = r.raceId
        )
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS seasons
        FROM driver_years dy
        JOIN drivers d ON dy.driverId = d.driverId
        GROUP BY d.driverId
        ORDER BY seasons DESC
    """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int seasons = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, seasons, getFlagUrl(nationality)));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverSeasonParticipationStreaks() {
        String sql = """
        WITH driver_years AS (
            SELECT DISTINCT res.driverId, r.year
            FROM results res
            JOIN races r ON res.raceId = r.raceId
        )
        SELECT d.driverId, d.forename, d.surname, d.nationality, dy.year
        FROM driver_years dy
        JOIN drivers d ON dy.driverId = d.driverId
        ORDER BY d.driverId, dy.year
    """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();

        Map<Long, List<Integer>> driverYears = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String forename = (String) row[1];
            String surname = (String) row[2];
            String nationality = (String) row[3];
            Integer year = ((Number) row[4]).intValue();

            driverYears.computeIfAbsent(driverId, k -> new ArrayList<>()).add(year);
            names.put(driverId, forename + " " + surname);
            nationalities.put(driverId, nationality);
        }

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<Integer>> entry : driverYears.entrySet()) {
            Long driverId = entry.getKey();
            List<Integer> years = entry.getValue();
            Collections.sort(years);

            int maxStreak = 1, currentStreak = 1;
            for (int i = 1; i < years.size(); i++) {
                if (years.get(i) == years.get(i - 1) + 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }

            result.add(new DriverRankingDTO(
                    names.get(driverId),
                    nationalities.get(driverId),
                    maxStreak,
                    getFlagUrl(nationalities.get(driverId))
            ));
        }

        result.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverHatTrickCount() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS hat_tricks
        FROM (
            SELECT r.raceId, r.driverId
            FROM results r
            JOIN qualifying q ON r.raceId = q.raceId AND r.driverId = q.driverId
            JOIN laptimes l ON r.raceId = l.raceId AND r.driverId = l.driverId
            WHERE r.positionOrder = 1
              AND q.position = 1
              AND r.fastestLap = (
                  SELECT MIN(r2.fastestLap)
                  FROM results r2
                  WHERE r2.raceId = r.raceId AND r2.fastestLap IS NOT NULL
              )
            GROUP BY r.raceId, r.driverId
        ) hat
        JOIN drivers d ON hat.driverId = d.driverId
        GROUP BY d.driverId, d.forename, d.surname, d.nationality
        ORDER BY hat_tricks DESC
    """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriverGrandSlamCount() {
        String sql = """
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS grand_slams
        FROM (
            SELECT r.raceId, r.driverId
            FROM results r
            JOIN qualifying q ON r.raceId = q.raceId AND r.driverId = q.driverId
            JOIN laptimes l ON r.raceId = l.raceId AND r.driverId = l.driverId
            WHERE r.positionOrder = 1
              AND q.position = 1
              AND r.fastestLap = (
                  SELECT MIN(r2.fastestLap)
                  FROM results r2
                  WHERE r2.raceId = r.raceId AND r2.fastestLap IS NOT NULL
              )
              AND r.laps = (
                  SELECT MAX(l2.lap)
                  FROM laptimes l2
                  WHERE l2.raceId = r.raceId AND l2.driverId = r.driverId
              )
            GROUP BY r.raceId, r.driverId
        ) gs
        JOIN drivers d ON gs.driverId = d.driverId
        GROUP BY d.driverId, d.forename, d.surname, d.nationality
        ORDER BY grand_slams DESC
    """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverFrontRowStarts() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, COUNT(*) AS front_rows
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position IN (1, 2)
            GROUP BY d.driverId, d.forename, d.surname, d.nationality
            ORDER BY front_rows DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getMostFrequentFrontRowDuos() {
        String sql = """
                    SELECT
                         LEAST(d1.driverId, d2.driverId) AS driver1Id,
                         GREATEST(d1.driverId, d2.driverId) AS driver2Id,
                         LEAST(CONCAT(d1.forename, ' ', d1.surname), CONCAT(d2.forename, ' ', d2.surname)) AS driver1Name,
                         GREATEST(CONCAT(d1.forename, ' ', d1.surname), CONCAT(d2.forename, ' ', d2.surname)) AS driver2Name,
                         LEAST(d1.nationality, d2.nationality) AS nationality1,
                         COUNT(*) AS front_row_count
                     FROM qualifying q1
                     JOIN qualifying q2 ON q1.raceId = q2.raceId AND q1.driverId <> q2.driverId
                     JOIN drivers d1 ON q1.driverId = d1.driverId
                     JOIN drivers d2 ON q2.driverId = d2.driverId
                     WHERE q1.position IN (1, 2) AND q2.position IN (1, 2)
                     GROUP BY\s
                         LEAST(d1.driverId, d2.driverId),
                         GREATEST(d1.driverId, d2.driverId),
                         LEAST(CONCAT(d1.forename, ' ', d1.surname), CONCAT(d2.forename, ' ', d2.surname)),
                         GREATEST(CONCAT(d1.forename, ' ', d1.surname), CONCAT(d2.forename, ' ', d2.surname)),
                         LEAST(d1.nationality, d2.nationality)
                     ORDER BY front_row_count DESC
                     
                """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String driver1 = (String) row[2];
            String driver2 = (String) row[3];
            String nationality = (String) row[4];
            int count = ((Number) row[5]).intValue();
            result.add(new DriverRankingDTO(driver1, nationality, count, getFlagUrl(nationality), driver2));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getYoungestDriversAtFrontRow() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, MIN(TIMESTAMPDIFF(YEAR, d.dob, r.date)) AS age
            FROM qualifying q
            JOIN races r ON q.raceId = r.raceId
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position IN (1, 2)
            GROUP BY d.driverId
            ORDER BY age ASC
            LIMIT 30
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int age = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, age, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getLongestFrontRowStreaks() {
        String sql = """
            SELECT q.driverId, d.forename, d.surname, d.nationality, r.year, r.round
            FROM qualifying q
            JOIN races r ON q.raceId = r.raceId
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position IN (1, 2)
            ORDER BY q.driverId, r.year, r.round
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();

        Map<Long, List<String>> appearances = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String fullName = row[1] + " " + row[2];
            String nationality = (String) row[3];
            String raceKey = row[4] + ":" + row[5];

            appearances.computeIfAbsent(driverId, k -> new ArrayList<>()).add(raceKey);
            names.put(driverId, fullName);
            nationalities.put(driverId, nationality);
        }

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<String>> entry : appearances.entrySet()) {
            Long driverId = entry.getKey();
            List<String> races = entry.getValue();
            int maxStreak = 1, currentStreak = 1;

            for (int i = 1; i < races.size(); i++) {
                String[] prev = races.get(i - 1).split(":"), curr = races.get(i).split(":");
                int prevYear = Integer.parseInt(prev[0]), prevRound = Integer.parseInt(prev[1]);
                int currYear = Integer.parseInt(curr[0]), currRound = Integer.parseInt(curr[1]);

                if ((currYear == prevYear && currRound == prevRound + 1) ||
                        (currYear == prevYear + 1 && prevRound >= 15 && currRound == 1)) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }

            result.add(new DriverRankingDTO(
                    names.get(driverId),
                    nationalities.get(driverId),
                    maxStreak,
                    getFlagUrl(nationalities.get(driverId))
            ));
        }

        result.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        return result;
    }

    @Override
    public List<DriverRankingDTO> getAverageGridPosition() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, AVG(q.grid) AS avg_grid
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.grid > 0
            GROUP BY d.driverId
            HAVING COUNT(*) >= 10
            ORDER BY avg_grid ASC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            double avg = ((Number) row[3]).doubleValue();
            result.add(new DriverRankingDTO(name, nationality, (int) Math.round(avg), getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getFastestQualifyingLaps() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality,
                   MIN(LEAST(q.q1, q.q2, q.q3)) AS best_lap
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.q1 IS NOT NULL OR q.q2 IS NOT NULL OR q.q3 IS NOT NULL
            GROUP BY d.driverId
            ORDER BY best_lap ASC
            LIMIT 30
            """;


        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int ms = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, ms, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getRaceFinishesCount() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, COUNT(*) AS finishes
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder IS NOT NULL AND r.statusId NOT IN ("Ret", "Dis")
            GROUP BY d.driverId
            ORDER BY finishes DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getConsecutiveRaceFinishes() {
        String sql = """
        SELECT r.driverId, d.forename, d.surname, d.nationality, ra.year, ra.round
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        JOIN status s ON r.statusId = s.statusId
        WHERE LOWER(s.status) NOT LIKE 'ret%'
          AND LOWER(s.status) NOT LIKE 'dis%'
          AND r.positionOrder IS NOT NULL
        ORDER BY r.driverId, ra.year, ra.round
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();

        Map<Long, List<String>> finishes = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String fullName = row[1] + " " + row[2];
            String nationality = (String) row[3];
            String raceKey = row[4] + ":" + row[5];

            finishes.computeIfAbsent(driverId, k -> new ArrayList<>()).add(raceKey);
            names.put(driverId, fullName);
            nationalities.put(driverId, nationality);
        }

        List<DriverRankingDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<String>> entry : finishes.entrySet()) {
            Long driverId = entry.getKey();
            List<String> races = entry.getValue();
            int maxStreak = 1, currentStreak = 1;

            for (int i = 1; i < races.size(); i++) {
                String[] prev = races.get(i - 1).split(":"), curr = races.get(i).split(":");
                int prevYear = Integer.parseInt(prev[0]), prevRound = Integer.parseInt(prev[1]);
                int currYear = Integer.parseInt(curr[0]), currRound = Integer.parseInt(curr[1]);

                if ((currYear == prevYear && currRound == prevRound + 1) ||
                        (currYear == prevYear + 1 && prevRound >= 15 && currRound == 1)) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }

            result.add(new DriverRankingDTO(
                    names.get(driverId),
                    nationalities.get(driverId),
                    maxStreak,
                    getFlagUrl(nationalities.get(driverId))
            ));
        }

        result.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        return result;
    }

    @Override
    public List<DriverRankingDTO> getClassifiedFinishesCount() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, COUNT(*) AS classified_count
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            JOIN status s ON r.statusId = s.statusId
            WHERE s.status LIKE 'Finished%' OR s.status REGEXP '^(+d+ laps|d+ laps)' 
            GROUP BY d.driverId
            ORDER BY classified_count DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getLongestStreakWithoutDNF() {
        String sql = """
            SELECT r.driverId, d.forename, d.surname, d.nationality, ra.year, ra.round, s.status
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            JOIN status s ON r.statusId = s.statusId
            WHERE s.status IS NOT NULL
            ORDER BY r.driverId, ra.year, ra.round
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();

        Map<Long, Integer> maxStreaks = new HashMap<>();
        Map<Long, Integer> currentStreaks = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String fullName = row[1] + " " + row[2];
            String nationality = (String) row[3];
            String status = ((String) row[6]).toLowerCase();

            names.put(driverId, fullName);
            nationalities.put(driverId, nationality);

            if (status.equals("finished") || status.matches("\\+\\d+ laps")) {
                currentStreaks.put(driverId, currentStreaks.getOrDefault(driverId, 0) + 1);
                maxStreaks.put(driverId, Math.max(maxStreaks.getOrDefault(driverId, 0), currentStreaks.get(driverId)));
            } else {
                currentStreaks.put(driverId, 0);
            }

        }

        List<DriverRankingDTO> result = new ArrayList<>();
        for (Long driverId : maxStreaks.keySet()) {
            result.add(new DriverRankingDTO(
                    names.get(driverId),
                    nationalities.get(driverId),
                    maxStreaks.get(driverId),
                    getFlagUrl(nationalities.get(driverId))
            ));
        }

        result.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        return result;
    }

    @Override
    public List<DriverRankingDTO> getDNFCount() {
        String sql = """
                WITH filtered_status AS (
                  SELECT statusId
                  FROM status
                  WHERE LOWER(status) NOT LIKE 'finished'
                    AND NOT (status REGEXP '^\\\\+[0-9]+ laps$')
                )
                SELECT d.forename, d.surname, d.nationality, COUNT(*) AS dnfs
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                JOIN filtered_status fs ON r.statusId = fs.statusId
                GROUP BY d.driverId
                ORDER BY dnfs DESC
                                """;


        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getConsecutiveDNFs() {
        String sql = """
                WITH dnf_status AS (
                  SELECT statusId
                  FROM status
                  WHERE LOWER(status) NOT LIKE 'finished'
                    AND NOT (status REGEXP '^\\\\+[0-9]+ laps$')
                )
                SELECT r.driverId, d.forename, d.surname, d.nationality, ra.year, ra.round
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                JOIN drivers d ON r.driverId = d.driverId
                LEFT JOIN dnf_status ds ON r.statusId = ds.statusId
                WHERE ds.statusId IS NOT NULL
                ORDER BY r.driverId, ra.year, ra.round
                        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();

        Map<Long, Integer> maxStreaks = new HashMap<>();
        Map<Long, Integer> currentStreaks = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, String> nationalities = new HashMap<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String fullName = row[1] + " " + row[2];
            String nationality = (String) row[3];

            int year = ((Number) row[4]).intValue();
            int round = ((Number) row[5]).intValue();

            String raceKey = year + ":" + round;

            // Guardar info del piloto
            names.put(driverId, fullName);
            nationalities.put(driverId, nationality);

            // Todas estas rows ya son DNF
            currentStreaks.put(driverId, currentStreaks.getOrDefault(driverId, 0) + 1);
            maxStreaks.put(driverId, Math.max(maxStreaks.getOrDefault(driverId, 0), currentStreaks.get(driverId)));
        }


        List<DriverRankingDTO> result = new ArrayList<>();
        for (Long driverId : maxStreaks.keySet()) {
            result.add(new DriverRankingDTO(
                    names.get(driverId),
                    nationalities.get(driverId),
                    maxStreaks.get(driverId),
                    getFlagUrl(nationalities.get(driverId))
            ));
        }

        result.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        return result;
    }


    @Override
    public List<DriverRankingDTO> getFirstLapDNFs() {
        String sql = """
                WITH dnf_status AS (
                  SELECT statusId
                  FROM status
                  WHERE LOWER(status) NOT LIKE 'finished'
                    AND NOT (status REGEXP '^\\\\+[0-9]+ laps$')
                )
                SELECT d.forename, d.surname, d.nationality, COUNT(*) AS dnf_first_lap
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                JOIN dnf_status ds ON r.statusId = ds.statusId
                WHERE r.lap = 1
                GROUP BY d.driverId
                ORDER BY dnf_first_lap DESC
                        """;


        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriversOnLeaderLapMostOften() {
        String sql = """
        WITH leader_laps AS (
          SELECT r1.raceId, MAX(r1.laps) AS leader_laps
          FROM results r1
          GROUP BY r1.raceId
        )
        SELECT d.forename, d.surname, d.nationality, COUNT(*) AS on_lead_lap
        FROM results r
        JOIN leader_laps l ON r.raceId = l.raceId AND r.laps = l.leader_laps
        JOIN drivers d ON r.driverId = d.driverId
        GROUP BY d.driverId
        ORDER BY on_lead_lap DESC

        """;


        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getAverageFinishPosition() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, AVG(r.positionOrder) AS avg_finish
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder IS NOT NULL
            GROUP BY d.driverId
            HAVING COUNT(*) >= 10
            ORDER BY avg_finish ASC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            double avg = ((Number) row[3]).doubleValue();
            result.add(new DriverRankingDTO(name, nationality, (int) Math.round(avg), getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getBestAveragePositionGains() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, AVG(r.grid - r.positionOrder) AS avg_gain
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.grid IS NOT NULL AND r.grid > 0 AND r.positionOrder IS NOT NULL
            GROUP BY d.driverId
            HAVING COUNT(*) >= 10
            ORDER BY avg_gain DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            double avg = ((Number) row[3]).doubleValue();
            result.add(new DriverRankingDTO(name, nationality, (int) Math.round(avg), getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getStartingGridAtDebut() {
        String sql = """
        WITH debut_dates AS (
            SELECT r2.driverId, MIN(r2a.date) AS debut_date
            FROM results r2
            JOIN races r2a ON r2.raceId = r2a.raceId
            WHERE r2.grid IS NOT NULL
            GROUP BY r2.driverId
        )
        SELECT d.forename, d.surname, d.nationality, r.grid
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        JOIN debut_dates dd ON r.driverId = dd.driverId AND ra.date = dd.debut_date
        ORDER BY r.grid ASC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int grid = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, grid, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getQualifyingAtDebut() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, q.position
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            JOIN races r ON q.raceId = r.raceId
            WHERE (q.driverId, r.date) IN (
                SELECT q2.driverId, MIN(r2.date)
                FROM qualifying q2
                JOIN races r2 ON q2.raceId = r2.raceId
                WHERE q2.position IS NOT NULL
                GROUP BY q2.driverId
            )
            ORDER BY q.position ASC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int position = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, position, getFlagUrl(nationality)));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getQualifyingAtLastRace() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, q.position
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            JOIN races r ON q.raceId = r.raceId
            WHERE (q.driverId, r.date) IN (
                SELECT q2.driverId, MAX(r2.date)
                FROM qualifying q2
                JOIN races r2 ON q2.raceId = r2.raceId
                WHERE q2.position IS NOT NULL
                GROUP BY q2.driverId
            )
            ORDER BY q.position ASC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int position = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, position, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getDriversNeverQualified() {
        String sql = """
            SELECT d.forename, d.surname, d.nationality, COUNT(*) AS entries
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            WHERE d.driverId NOT IN (
                SELECT DISTINCT q.driverId FROM qualifying q
            )
            GROUP BY d.driverId
            ORDER BY entries DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

        return result;
    }

    @Override
    public List<DriverRankingDTO> getDisqualificationCount() {
        String sql = """
                SELECT d.forename, d.surname, d.nationality, COUNT(*) AS disq_count
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                JOIN status s ON r.statusId = s.statusId
                WHERE LOWER(s.status) LIKE '%disq%' OR LOWER(s.status) LIKE '%dis%'                                                                                               
                GROUP BY d.driverId
                ORDER BY disq_count DESC
                """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String name = row[0] + " " + row[1];
            String nationality = (String) row[2];
            int count = ((Number) row[3]).intValue();
            result.add(new DriverRankingDTO(name, nationality, count, getFlagUrl(nationality)));
        }

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

    private static final Map<String, Set<String>> NATIONALITY_TO_COUNTRIES = Map.ofEntries(
            Map.entry("british", Set.of("UK")),
            Map.entry("english", Set.of("UK")),
            Map.entry("scottish", Set.of("UK")),
            Map.entry("welsh", Set.of("UK")),
            Map.entry("american", Set.of("USA", "United States")),
            Map.entry("german", Set.of("Germany")),
            Map.entry("french", Set.of("France")),
            Map.entry("spanish", Set.of("Spain")),
            Map.entry("brazilian", Set.of("Brazil")),
            Map.entry("italian", Set.of("Italy")),
            Map.entry("japanese", Set.of("Japan")),
            Map.entry("canadian", Set.of("Canada")),
            Map.entry("australian", Set.of("Australia")),
            Map.entry("argentine", Set.of("Argentina")),
            Map.entry("mexican", Set.of("Mexico")),
            Map.entry("dutch", Set.of("Netherlands")),
            Map.entry("monegasque", Set.of("Monaco")),
            Map.entry("finnish", Set.of("Finland")),
            Map.entry("russian", Set.of("Russia")),
            Map.entry("austrian", Set.of("Austria")),
            Map.entry("portuguese", Set.of("Portugal")),
            Map.entry("swiss", Set.of("Switzerland")),
            Map.entry("south african", Set.of("South Africa")),
            Map.entry("swedish", Set.of("Sweden")),
            Map.entry("belgian", Set.of("Belgium")),
            Map.entry("hungarian", Set.of("Hungary"))
            // Añade más si es necesario
    );

    public static boolean isHomeGP(String nationality, String country) {
        if (nationality == null || country == null) return false;
        Set<String> validCountries = NATIONALITY_TO_COUNTRIES.get(nationality.trim().toLowerCase());
        return validCountries != null && validCountries.contains(country.trim());
    }

    private DriverRankingDTO mapRowToDriverRanking(Object[] row) {
        String name = row[0] + " " + row[1];
        String nationality = (String) row[2];
        int value = ((Number) row[3]).intValue();
        return new DriverRankingDTO(name, nationality, value, getFlagUrl(nationality));
    }
}
