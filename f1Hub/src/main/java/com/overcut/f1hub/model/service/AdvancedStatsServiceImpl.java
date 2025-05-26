package com.overcut.f1hub.model.service;

import com.overcut.f1hub.model.entities.*;
import com.overcut.f1hub.rest.controllers.ChartController;
import com.overcut.f1hub.rest.dtos.ChartDataDTO;
import com.overcut.f1hub.rest.dtos.ChartSeriesDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdvancedStatsServiceImpl implements AdvancedStatsService {

    @Autowired
    private ResultDao resultDao;

    @Autowired
    private RaceDao raceDao;

    @Autowired
    private DriverDao driverDao;

    @Autowired
    private QualifyingDao qualifyingDao;

    @Autowired
    private LapTimeDao lapTimeDao;

    @Autowired
    private ConstructorDao constructorDao;

    @Autowired
    private DriverStandingDao driverStandingDao;

    @Autowired
    private ConstructorStandingDao constructorStandingDao;

    @Autowired
    private StatusDao statusDao;

    @Autowired
    private PitStopDao pitStopDao;




    public List<DriverOption> getAllDrivers() {
        return driverDao.findAll().stream()
                .sorted(Comparator.comparing(d -> d.getSurname() + d.getForename()))
                .map(d -> new DriverOption(d.getDriverId(), d.getForename() + " " + d.getSurname()))
                .collect(Collectors.toList());
    }

    public List<ConstructorOption> getAllConstructors() {
        return constructorDao.findAll().stream()
                .sorted(Comparator.comparing(Constructor::getName))
                .map(c -> new ConstructorOption(c.getConstructorId(), c.getName()))
                .collect(Collectors.toList());
    }

    public List<Integer> getAllSeasons() {
        return raceDao.findAll().stream()
                .map(Race::getYear)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
    @Override
    public ChartDataDTO getAveragePointsPerSeasonByDriver() {
        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(
                        Driver::getDriverId,
                        d -> d.getForename() + " " + d.getSurname()
                ));

        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(
                        Race::getRaceId,
                        Race::getYear
                ));

        // Map<DriverId, Map<Year, TotalPoints>>
        Map<Long, Map<Integer, List<Double>>> driverYearPoints = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            Long driverId = r.getDriver().getDriverId();
            Integer year = raceYearMap.get(r.getRace().getRaceId());
            Double points = r.getPoints();

            if (year == null || points == null) continue;

            driverYearPoints
                    .computeIfAbsent(driverId, k -> new HashMap<>())
                    .computeIfAbsent(year, y -> new ArrayList<>())
                    .add(points);
        }

        Set<Integer> allYears = new TreeSet<>();
        driverYearPoints.values().forEach(map -> allYears.addAll(map.keySet()));
        List<String> yearLabels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, List<Double>>> entry : driverYearPoints.entrySet()) {
            Long driverId = entry.getKey();
            String label = driverNames.getOrDefault(driverId, "Driver " + driverId);
            List<Double> data = new ArrayList<>();
            for (Integer year : allYears) {
                List<Double> pts = entry.getValue().getOrDefault(year, Collections.emptyList());
                data.add(pts.stream().mapToDouble(d -> d).average().orElse(0.0));
            }
            datasets.add(new ChartSeriesDTO(label, "#8884d8", data)); // puedes reemplazar el color por nacionalidad
        }

        return new ChartDataDTO("Promedio de puntos por temporada", "line", yearLabels, datasets);
    }

    @Override
    public ChartDataDTO getVictoryPercentageByDriverPerSeason() {
        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(
                        Driver::getDriverId,
                        d -> d.getForename() + " " + d.getSurname()
                ));

        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(
                        Race::getRaceId,
                        Race::getYear
                ));

        // Map<DriverId, Map<Year, [wins, totalRaces]>>
        Map<Long, Map<Integer, int[]>> stats = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            Long driverId = r.getDriver().getDriverId();
            Integer year = raceYearMap.get(r.getRace().getRaceId());
            if (year == null) continue;

            stats.computeIfAbsent(driverId, k -> new HashMap<>());
            Map<Integer, int[]> yearly = stats.get(driverId);
            int[] counts = yearly.computeIfAbsent(year, y -> new int[2]);
            counts[1]++; // total races
            if (r.getPositionOrder() != null && r.getPositionOrder() == 1) {
                counts[0]++; // wins
            }
        }

        Set<Integer> allYears = new TreeSet<>();
        stats.values().forEach(map -> allYears.addAll(map.keySet()));
        List<String> yearLabels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, int[]>> entry : stats.entrySet()) {
            Long driverId = entry.getKey();
            String label = driverNames.getOrDefault(driverId, "Driver " + driverId);
            List<Double> data = new ArrayList<>();
            for (Integer year : allYears) {
                int[] val = entry.getValue().getOrDefault(year, new int[]{0, 0});
                double percent = (val[1] == 0) ? 0.0 : (100.0 * val[0]) / val[1];
                data.add(percent);
            }
            datasets.add(new ChartSeriesDTO(label, "#82ca9d", data)); // color genérico
        }

        return new ChartDataDTO("Porcentaje de victorias por temporada", "bar", yearLabels, datasets);
    }


    @Override
    public ChartDataDTO getPodiumPercentageVsTeammate(String driverIdStr) {
        Long targetDriverId = Long.parseLong(driverIdStr);

        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Race> raceMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        // Map<Year, [driverPodiums, teamTotalPodiums]>
        Map<Integer, int[]> seasonPodiums = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            Integer year = raceMap.containsKey(r.getRace().getRaceId()) ? raceMap.get(r.getRace().getRaceId()).getYear() : null;
            if (year == null || r.getConstructor().getConstructorId() == null || r.getDriver().getDriverId() == null) continue;
            if (r.getPositionOrder() == null || r.getPositionOrder() > 3) continue; // only podiums

            int[] values = seasonPodiums.computeIfAbsent(year, y -> new int[]{0, 0});
            values[1]++; // team total podiums

            if (Objects.equals(r.getDriver().getDriverId(), targetDriverId)) {
                values[0]++; // driver podiums
            }
        }

        List<Integer> allYears = seasonPodiums.keySet().stream().sorted().toList();
        List<String> labels = allYears.stream().map(String::valueOf).toList();
        List<Double> data = new ArrayList<>();

        for (Integer year : allYears) {
            int[] vals = seasonPodiums.get(year);
            double pct = (vals[1] == 0) ? 0.0 : (100.0 * vals[0]) / vals[1];
            data.add(pct);
        }

        String driverName = driverMap.containsKey(targetDriverId)
                ? driverMap.get(targetDriverId).getForename() + " " + driverMap.get(targetDriverId).getSurname()
                : "Driver " + targetDriverId;

        ChartSeriesDTO series = new ChartSeriesDTO(driverName, "#ffc658", data);

        return new ChartDataDTO("Porcentaje de podios vs compañero (" + driverName + ")", "bar", labels, List.of(series));
    }


    @Override
    public ChartDataDTO getQ3PercentageVsTeammate(String driverIdStr) {
        Long targetDriverId = Long.parseLong(driverIdStr);

        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Race> raceMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        // Map<Year, [driverQ3s, teamTotalQ3s]>
        Map<Integer, int[]> seasonQ3s = new HashMap<>();

        for (Qualifying q : qualifyingDao.findAll()) {
            Integer year = raceMap.containsKey(q.getRace().getRaceId()) ? raceMap.get(q.getRace().getRaceId()).getYear() : null;
            if (year == null || q.getConstructor().getConstructorId() == null || q.getDriver().getDriverId() == null) continue;
            if (q.getQ3() == null) continue;

            int[] values = seasonQ3s.computeIfAbsent(year, y -> new int[]{0, 0});
            values[1]++; // total Q3s for team
            if (Objects.equals(q.getDriver().getDriverId(), targetDriverId)) {
                values[0]++; // Q3s for this driver
            }
        }

        List<Integer> allYears = seasonQ3s.keySet().stream().sorted().toList();
        List<String> labels = allYears.stream().map(String::valueOf).toList();
        List<Double> data = new ArrayList<>();

        for (Integer year : allYears) {
            int[] vals = seasonQ3s.get(year);
            double pct = (vals[1] == 0) ? 0.0 : (100.0 * vals[0]) / vals[1];
            data.add(pct);
        }

        String driverName = driverMap.containsKey(targetDriverId)
                ? driverMap.get(targetDriverId).getForename() + " " + driverMap.get(targetDriverId).getSurname()
                : "Driver " + targetDriverId;

        ChartSeriesDTO series = new ChartSeriesDTO(driverName, "#ff7f50", data);
        return new ChartDataDTO("Porcentaje de Q3 vs compañero (" + driverName + ")", "bar", labels, List.of(series));
    }


    @Override
    public ChartDataDTO getAverageAccidentsBySeason() {
        Map<Long, Integer> statusMap = statusDao.findAll().stream()
                .filter(s -> s.getStatus().toLowerCase().contains("accident"))
                .collect(Collectors.toMap(Status::getStatusId, s -> 1));

        Map<Long, Integer> raceYears = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        Map<Integer, Integer> yearCounts = new HashMap<>();
        Map<Integer, Integer> yearAccidents = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            Integer year = raceYears.get(r.getRace().getRaceId());
            if (year == null) continue;
            yearCounts.merge(year, 1, Integer::sum);
            if (statusMap.containsKey(r.getStatus().getStatusId())) {
                yearAccidents.merge(year, 1, Integer::sum);
            }
        }

        List<String> labels = yearCounts.keySet().stream().sorted().map(String::valueOf).toList();
        List<Double> data = labels.stream()
                .map(Integer::parseInt)
                .map(y -> {
                    int acc = yearAccidents.getOrDefault(y, 0);
                    int total = yearCounts.getOrDefault(y, 1);
                    return (double) acc / total;
                })
                .toList();

        return new ChartDataDTO("Promedio de accidentes por temporada", "line", labels, List.of(
                new ChartSeriesDTO("Accidentes / Resultados", "#ff7300", data)
        ));
    }


    @Override
    public ChartDataDTO getAvgPositionsGainedFirstLaps() {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Map<driverId, List<posiciones ganadas en vuelta 2>
        Map<Long, List<Integer>> gains = new HashMap<>();

        Map<String, LapTime> lap2Map = lapTimeDao.findAll().stream()
                .filter(l -> l.getLap() == 2)
                .collect(Collectors.toMap(
                        l -> l.getRaceId() + "_" + l.getDriverId(),
                        l -> l,
                        (a, b) -> a // evitar colisiones
                ));

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getGrid() == 0) continue; // no clasificación válida
            String key = r.getRace().getRaceId() + "_" + r.getDriver().getDriverId();
            LapTime lap2 = lap2Map.get(key);
            if (lap2 == null || lap2.getPosition() == null) continue;

            int grid = r.getGrid();
            int posAfterLap2 = lap2.getPosition();
            int delta = grid - posAfterLap2;

            gains.computeIfAbsent(r.getDriver().getDriverId(), k -> new ArrayList<>()).add(delta);
        }

        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, List<Integer>> entry : gains.entrySet()) {
            Long driverId = entry.getKey();
            List<Integer> list = entry.getValue();
            double avgGain = list.stream().mapToInt(i -> i).average().orElse(0);
            String label = driverMap.containsKey(driverId)
                    ? driverMap.get(driverId).getForename() + " " + driverMap.get(driverId).getSurname()
                    : "Driver " + driverId;
            datasets.add(new ChartSeriesDTO(label, "#8884d8", List.of(avgGain)));
        }

        return new ChartDataDTO(
                "Promedio de posiciones ganadas tras 2 vueltas",
                "bar",
                List.of("Ganancia promedio"),
                datasets
        );
    }


    @Override
    public ChartDataDTO getAvgPositionsGainedBySeason(String driverIdStr) {
        Long driverId = Long.parseLong(driverIdStr);

        Map<Long, Race> raceMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        // Map<year, List<deltas>>
        Map<Integer, List<Integer>> gains = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (!Objects.equals(r.getDriver().getDriverId(), driverId)) continue;
            if (r.getGrid() == null || r.getPositionOrder() == null) continue;

            Integer year = raceMap.get(r.getRace().getRaceId()).getYear();
            int delta = r.getGrid() - r.getPositionOrder();

            gains.computeIfAbsent(year, y -> new ArrayList<>()).add(delta);
        }

        List<Integer> sortedYears = gains.keySet().stream().sorted().toList();
        List<String> labels = sortedYears.stream().map(String::valueOf).toList();
        List<Double> data = new ArrayList<>();

        for (Integer year : sortedYears) {
            List<Integer> deltas = gains.get(year);
            double avg = deltas.stream().mapToInt(i -> i).average().orElse(0);
            data.add(avg);
        }

        Driver driver = driverDao.findById(driverId).orElse(null);
        String label = (driver != null)
                ? driver.getForename() + " " + driver.getSurname()
                : "Driver " + driverId;

        ChartSeriesDTO series = new ChartSeriesDTO(label, "#8884d8", data);

        return new ChartDataDTO("Posiciones ganadas por temporada (" + label + ")", "line", labels, List.of(series));
    }


    @Override
    public ChartDataDTO getQualiVsTeammateComparison(String driverIdStr) {
        Long targetDriverId = Long.parseLong(driverIdStr);

        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Race> raceMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        // Map<year, [victorias, derrotas]>
        Map<Integer, int[]> seasonStats = new HashMap<>();

        Map<Long, List<Qualifying>> qualisByRace = qualifyingDao.findAll().stream()
                .collect(Collectors.groupingBy(q -> q.getRace().getRaceId()));

        for (Map.Entry<Long, List<Qualifying>> entry : qualisByRace.entrySet()) {
            List<Qualifying> qualis = entry.getValue();

            // Agrupar por equipo
            Map<Long, List<Qualifying>> byTeam = qualis.stream()
                    .filter(q -> q.getConstructor() != null && q.getDriver() != null)
                    .collect(Collectors.groupingBy(q -> q.getConstructor().getConstructorId()));

            for (List<Qualifying> teamQualis : byTeam.values()) {
                Optional<Qualifying> driverQ = teamQualis.stream()
                        .filter(q -> q.getDriver().getDriverId().equals(targetDriverId))
                        .findFirst();

                if (driverQ.isEmpty()) continue;

                Qualifying qTarget = driverQ.get();
                if (qTarget.getPosition() == null) continue;

                Integer year = raceMap.get(qTarget.getRace().getRaceId()).getYear();
                if (year == null) continue;

                List<Qualifying> teammates = teamQualis.stream()
                        .filter(q -> !q.getDriver().getDriverId().equals(targetDriverId))
                        .filter(q -> q.getPosition() != null)
                        .toList();

                for (Qualifying teammate : teammates) {
                    int[] stats = seasonStats.computeIfAbsent(year, y -> new int[2]);
                    if (qTarget.getPosition() < teammate.getPosition()) {
                        stats[0]++; // victoria
                    } else {
                        stats[1]++; // derrota
                    }
                }
            }
        }

        List<Integer> years = seasonStats.keySet().stream().sorted().toList();
        List<String> labels = years.stream().map(String::valueOf).toList();

        List<Double> wins = new ArrayList<>();
        List<Double> losses = new ArrayList<>();

        for (Integer year : years) {
            int[] stats = seasonStats.get(year);
            wins.add((double) stats[0]);
            losses.add((double) stats[1]);
        }

        String driverName = driverMap.containsKey(targetDriverId)
                ? driverMap.get(targetDriverId).getForename() + " " + driverMap.get(targetDriverId).getSurname()
                : "Driver " + targetDriverId;

        return new ChartDataDTO(
                "Comparativa clasificación vs compañero - " + driverName,
                "bar",
                labels,
                List.of(
                        new ChartSeriesDTO("Victorias en quali", "#00bcd4", wins),
                        new ChartSeriesDTO("Derrotas en quali", "#ff5722", losses)
                )
        );
    }


    @Override
    public ChartDataDTO getRaceVsTeammateComparison(String driverIdStr) {
        Long targetDriverId = Long.parseLong(driverIdStr);

        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Race> raceMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        // Map<year, [wins, losses]>
        Map<Integer, int[]> seasonStats = new HashMap<>();

        Map<Long, List<Result>> resultsByRace = resultDao.findAll().stream()
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));

        for (Map.Entry<Long, List<Result>> raceEntry : resultsByRace.entrySet()) {
            List<Result> results = raceEntry.getValue();

            // Agrupar por equipo
            Map<Long, List<Result>> resultsByTeam = results.stream()
                    .filter(r -> r.getConstructor() != null && r.getDriver() != null)
                    .collect(Collectors.groupingBy(r -> r.getConstructor().getConstructorId()));

            for (List<Result> teamResults : resultsByTeam.values()) {
                Optional<Result> driverResultOpt = teamResults.stream()
                        .filter(r -> r.getDriver().getDriverId().equals(targetDriverId))
                        .findFirst();

                if (driverResultOpt.isEmpty()) continue;

                Result driverResult = driverResultOpt.get();
                Integer year = raceMap.get(driverResult.getRace().getRaceId()).getYear();
                if (year == null || driverResult.getPositionOrder() == null) continue;

                // Buscar compañeros con posición válida
                List<Result> teammates = teamResults.stream()
                        .filter(r -> !r.getDriver().getDriverId().equals(targetDriverId))
                        .filter(r -> r.getPositionOrder() != null)
                        .toList();

                for (Result teammate : teammates) {
                    int[] winLoss = seasonStats.computeIfAbsent(year, y -> new int[2]);
                    if (driverResult.getPositionOrder() < teammate.getPositionOrder()) {
                        winLoss[0]++; // victoria sobre el compañero
                    } else {
                        winLoss[1]++; // derrota frente al compañero
                    }
                }
            }
        }

        List<Integer> years = seasonStats.keySet().stream().sorted().toList();
        List<String> labels = years.stream().map(String::valueOf).toList();

        List<Double> wins = new ArrayList<>();
        List<Double> losses = new ArrayList<>();

        for (Integer year : years) {
            int[] stats = seasonStats.get(year);
            wins.add((double) stats[0]);
            losses.add((double) stats[1]);
        }

        String driverName = driverMap.containsKey(targetDriverId)
                ? driverMap.get(targetDriverId).getForename() + " " + driverMap.get(targetDriverId).getSurname()
                : "Driver " + targetDriverId;

        return new ChartDataDTO(
                "Comparativa carrera vs compañero - " + driverName,
                "bar",
                labels,
                List.of(
                        new ChartSeriesDTO("Victorias sobre compañero", "#00C49F", wins),
                        new ChartSeriesDTO("Derrotas frente a compañero", "#FF8042", losses)
                )
        );
    }


    @Override
    public ChartDataDTO getWinsFrom3rdOrWorse() {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Integer> winCount = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getPositionOrder() != null && r.getPositionOrder() == 1 && r.getGrid() != null && r.getGrid() > 2) {
                Long driverId = r.getDriver().getDriverId();
                winCount.merge(driverId, 1, Integer::sum);
            }
        }

        List<ChartSeriesDTO> dataset = winCount.entrySet().stream()
                .map(e -> {
                    String label = driverMap.containsKey(e.getKey())
                            ? driverMap.get(e.getKey()).getForename() + " " + driverMap.get(e.getKey()).getSurname()
                            : "Driver " + e.getKey();
                    return new ChartSeriesDTO(label, "#8884d8", List.of((double) e.getValue()));
                })
                .toList();

        return new ChartDataDTO("Victorias desde P3 o peor", "bar", List.of("Victorias desde atrás"), dataset);
    }


    @Override
    public ChartDataDTO getPodiumsFrom3rdOrWorse() {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Integer> podiums = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getPositionOrder() != null && r.getPositionOrder() <= 3 && r.getGrid() != null && r.getGrid() > 2) {
                Long driverId = r.getDriver().getDriverId();
                podiums.merge(driverId, 1, Integer::sum);
            }
        }

        List<ChartSeriesDTO> dataset = podiums.entrySet().stream()
                .map(e -> {
                    String label = driverMap.containsKey(e.getKey())
                            ? driverMap.get(e.getKey()).getForename() + " " + driverMap.get(e.getKey()).getSurname()
                            : "Driver " + e.getKey();
                    return new ChartSeriesDTO(label, "#8884d8", List.of((double) e.getValue()));
                }).toList();

        return new ChartDataDTO("Podios desde P3 o peor", "bar", List.of("Podios desde atrás"), dataset);
    }


    @Override
    public ChartDataDTO getMostCommonFinishPosition() {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Map<driverId, Map<position, count>>
        Map<Long, Map<Integer, Integer>> positionCounts = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getPositionOrder() == null) continue;
            Long driverId = r.getDriver().getDriverId();
            int pos = r.getPositionOrder();

            positionCounts
                    .computeIfAbsent(driverId, k -> new HashMap<>())
                    .merge(pos, 1, Integer::sum);
        }

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Integer>> entry : positionCounts.entrySet()) {
            Long driverId = entry.getKey();
            Map<Integer, Integer> posMap = entry.getValue();

            Optional<Map.Entry<Integer, Integer>> mostCommon = posMap.entrySet().stream()
                    .max(Map.Entry.comparingByValue());

            if (mostCommon.isPresent()) {
                String label = driverMap.containsKey(driverId)
                        ? driverMap.get(driverId).getForename() + " " + driverMap.get(driverId).getSurname()
                        : "Driver " + driverId;

                dataset.add(new ChartSeriesDTO(label, "#8884d8", List.of((double) mostCommon.get().getKey())));
            }
        }

        return new ChartDataDTO(
                "Posición más frecuente en carrera por piloto",
                "bar",
                List.of("Posición más común"),
                dataset
        );
    }


    @Override
    public ChartDataDTO getMostCommonQualiPosition() {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Map<driverId, Map<position, count>>
        Map<Long, Map<Integer, Integer>> positionCounts = new HashMap<>();

        for (Qualifying q : qualifyingDao.findAll()) {
            if (q.getPosition() == null) continue;
            Long driverId = q.getDriver().getDriverId();
            int pos = q.getPosition();

            positionCounts
                    .computeIfAbsent(driverId, k -> new HashMap<>())
                    .merge(pos, 1, Integer::sum);
        }

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Integer>> entry : positionCounts.entrySet()) {
            Long driverId = entry.getKey();
            Map<Integer, Integer> posMap = entry.getValue();

            Optional<Map.Entry<Integer, Integer>> mostCommon = posMap.entrySet().stream()
                    .max(Map.Entry.comparingByValue());

            if (mostCommon.isPresent()) {
                String label = driverMap.containsKey(driverId)
                        ? driverMap.get(driverId).getForename() + " " + driverMap.get(driverId).getSurname()
                        : "Driver " + driverId;

                dataset.add(new ChartSeriesDTO(label, "#8884d8", List.of((double) mostCommon.get().getKey())));
            }
        }

        return new ChartDataDTO(
                "Posición más frecuente en clasificación por piloto",
                "bar",
                List.of("Posición más común"),
                dataset
        );
    }


    @Override
    public ChartDataDTO getAvgGapToPolePerSeason() {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Map<DriverId, Map<Year, List<gap_in_ms>>>
        Map<Long, Map<Integer, List<Double>>> gaps = new HashMap<>();

        for (Qualifying q : qualifyingDao.findAll()) {
            Long driverId = q.getDriver().getDriverId();
            Integer year = raceYearMap.get(q.getRace().getRaceId());
            if (driverId == null || year == null || q.getQ3() == null) continue;

            double driverTimeMs = parseTimeToMillis(q.getQ3());
            if (driverTimeMs == 0) continue;

            OptionalDouble poleTimeOpt = qualifyingDao.findAll().stream()
                    .filter(x -> x.getRace().getRaceId().equals(q.getRace().getRaceId()) && x.getQ3() != null)
                    .mapToDouble(x -> parseTimeToMillis(x.getQ3()))
                    .min();

            if (poleTimeOpt.isEmpty()) continue;

            double gap = driverTimeMs - poleTimeOpt.getAsDouble();
            gaps.computeIfAbsent(driverId, k -> new HashMap<>())
                    .computeIfAbsent(year, y -> new ArrayList<>())
                    .add(gap);
        }

        Set<Integer> allYears = new TreeSet<>();
        gaps.values().forEach(map -> allYears.addAll(map.keySet()));
        List<String> yearLabels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, List<Double>>> entry : gaps.entrySet()) {
            Long driverId = entry.getKey();
            String label = driverMap.get(driverId).getForename() + " " + driverMap.get(driverId).getSurname();
            List<Double> data = new ArrayList<>();
            for (Integer year : allYears) {
                List<Double> diff = entry.getValue().getOrDefault(year, List.of());
                double avg = diff.stream().mapToDouble(d -> d).average().orElse(0.0);
                data.add(avg);
            }
            datasets.add(new ChartSeriesDTO(label, "#a4de6c", data));
        }

        return new ChartDataDTO("Gap promedio con la pole (Q3)", "line", yearLabels, datasets);
    }

    private double parseTimeToMillis(String timeStr) {
        try {
            if (timeStr == null) return 0;
            String[] parts = timeStr.split(":");
            if (parts.length == 2) {
                return Integer.parseInt(parts[0]) * 60_000 + Double.parseDouble(parts[1]) * 1000;
            } else {
                return Double.parseDouble(timeStr) * 1000;
            }
        } catch (Exception e) {
            return 0;
        }
    }


    @Override
    public ChartDataDTO getDriverVsTeamChampionshipFinish() {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Race> racesById = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        // Map<driverId, count>
        Map<Long, Integer> matches = new HashMap<>();

        List<Race> finalRaces = raceDao.findAll().stream()
                .collect(Collectors.groupingBy(Race::getYear))
                .values().stream()
                .map(list -> list.stream().max(Comparator.comparingInt(Race::getRound)).orElse(null))
                .filter(Objects::nonNull)
                .toList();

        Set<Long> finalRaceIds = finalRaces.stream().map(Race::getRaceId).collect(Collectors.toSet());

        List<DriverStanding> driverStandings = driverStandingDao.findAll().stream()
                .filter(ds -> finalRaceIds.contains(ds.getRaceId()))
                .toList();

        List<ConstructorStanding> constructorStandings = constructorStandingDao.findAll().stream()
                .filter(cs -> finalRaceIds.contains(cs.getRaceId()))
                .toList();

        Map<Integer, Map<Long, Integer>> driverFinalPos = new HashMap<>();
        Map<Integer, Integer> teamFinalPos = new HashMap<>();

        for (DriverStanding ds : driverStandings) {
            int year = racesById.get(ds.getRaceId()).getYear();
            driverFinalPos.computeIfAbsent(year, y -> new HashMap<>())
                    .put(ds.getDriverId(), ds.getPosition());
        }

        for (ConstructorStanding cs : constructorStandings) {
            int year = racesById.get(cs.getRaceId()).getYear();
            teamFinalPos.put(year, cs.getPosition());
        }

        for (Map.Entry<Integer, Map<Long, Integer>> entry : driverFinalPos.entrySet()) {
            Integer year = entry.getKey();
            Integer teamPos = teamFinalPos.getOrDefault(year, 99);
            for (Map.Entry<Long, Integer> driverEntry : entry.getValue().entrySet()) {
                if (driverEntry.getValue() <= teamPos) {
                    matches.merge(driverEntry.getKey(), 1, Integer::sum);
                }
            }
        }

        List<ChartSeriesDTO> dataset = matches.entrySet().stream()
                .map(e -> {
                    String label = driverMap.containsKey(e.getKey())
                            ? driverMap.get(e.getKey()).getForename() + " " + driverMap.get(e.getKey()).getSurname()
                            : "Driver " + e.getKey();
                    return new ChartSeriesDTO(label, "#8884d8", List.of((double) e.getValue()));
                }).toList();

        return new ChartDataDTO("Pilotos que superaron o igualaron al equipo en el campeonato", "bar", List.of("Veces"), dataset);
    }


    @Override
    public ChartDataDTO getWinsWithoutTop2() {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        // Map<constructorId, count>
        Map<Long, Integer> winsMap = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getGrid() == null || r.getPositionOrder() == null) continue;
            if (r.getPositionOrder() == 1 && r.getGrid() > 2) {
                Long constructorId = r.getConstructor().getConstructorId();
                winsMap.merge(constructorId, 1, Integer::sum);
            }
        }

        List<ChartSeriesDTO> dataset = winsMap.entrySet().stream()
                .map(e -> {
                    String label = constructorMap.getOrDefault(e.getKey(), new Constructor()).getName();
                    return new ChartSeriesDTO(label, "#8884d8", List.of((double) e.getValue()));
                })
                .toList();

        return new ChartDataDTO(
                "Victorias sin salir desde 1ª o 2ª posición",
                "bar",
                List.of("Victorias desde P3+"),
                dataset
        );
    }


    @Override
    public ChartDataDTO getTeamComebacksBySeason() {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Map<constructorId, Map<year, List<posiciones ganadas>>>
        Map<Long, Map<Integer, List<Integer>>> data = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getPositionOrder() == null || r.getConstructor() == null) continue;
            int delta = r.getGrid() - r.getPositionOrder(); // posiciones ganadas
            Long constructorId = r.getConstructor().getConstructorId();
            Integer year = raceYearMap.get(r.getRace().getRaceId());
            if (year == null) continue;

            data.computeIfAbsent(constructorId, k -> new HashMap<>())
                    .computeIfAbsent(year, y -> new ArrayList<>())
                    .add(delta);
        }

        Set<Integer> allYears = new TreeSet<>();
        data.values().forEach(map -> allYears.addAll(map.keySet()));
        List<String> labels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, List<Integer>>> teamEntry : data.entrySet()) {
            Long constructorId = teamEntry.getKey();
            String label = constructorMap.getOrDefault(constructorId, new Constructor()).getName();
            List<Double> values = new ArrayList<>();
            for (Integer year : allYears) {
                List<Integer> deltas = teamEntry.getValue().getOrDefault(year, List.of());
                double avg = deltas.stream().mapToInt(i -> i).average().orElse(0.0);
                values.add(avg);
            }
            datasets.add(new ChartSeriesDTO(label, "#8884d8", values));
        }

        return new ChartDataDTO("Promedio de posiciones ganadas por equipo y temporada", "line", labels, datasets);
    }


    @Override
    public ChartDataDTO getMostTeamPoints() {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        // Map<constructorId, totalPoints>
        Map<Long, Double> totalPoints = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getPoints() == null) continue;
            Long constructorId = r.getConstructor().getConstructorId();
            totalPoints.merge(constructorId, r.getPoints(), Double::sum);
        }

        List<ChartSeriesDTO> dataset = totalPoints.entrySet().stream()
                .map(e -> {
                    String label = constructorMap.getOrDefault(e.getKey(), new Constructor()).getName();
                    return new ChartSeriesDTO(label, "#82ca9d", List.of(e.getValue()));
                })
                .toList();

        return new ChartDataDTO(
                "Puntos totales por equipo (histórico)",
                "bar",
                List.of("Total puntos"),
                dataset
        );
    }


    @Override
    public ChartDataDTO getAvgPointsPerTeamPerSeason() {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Map<constructorId, Map<year, totalPoints>>
        Map<Long, Map<Integer, Double>> data = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getPoints() == null) continue;
            Long constructorId = r.getConstructor().getConstructorId();
            Integer year = raceYearMap.get(r.getRace().getRaceId());
            if (year == null) continue;

            data.computeIfAbsent(constructorId, k -> new HashMap<>())
                    .merge(year, r.getPoints(), Double::sum);
        }

        Set<Integer> allYears = new TreeSet<>();
        data.values().forEach(map -> allYears.addAll(map.keySet()));
        List<String> labels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Double>> entry : data.entrySet()) {
            Long constructorId = entry.getKey();
            String label = constructorMap.getOrDefault(constructorId, new Constructor()).getName();
            List<Double> pointsPerYear = new ArrayList<>();
            for (Integer year : allYears) {
                pointsPerYear.add(entry.getValue().getOrDefault(year, 0.0));
            }
            datasets.add(new ChartSeriesDTO(label, "#82ca9d", pointsPerYear));
        }

        return new ChartDataDTO("Puntos por equipo y temporada", "line", labels, datasets);
    }


    @Override
    public ChartDataDTO getPitStopsPerRace(String yearStr) {
        int year = Integer.parseInt(yearStr);

        // Obtener carreras de la temporada
        Map<Long, Race> raceMap = raceDao.findAll().stream()
                .filter(r -> r.getYear() == year)  // Filtramos solo las carreras de ese año
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        // Contar las paradas por carrera
        Map<Long, Integer> pitCount = new HashMap<>();
        for (PitStop p : pitStopDao.findAll()) {
            // Solo contar las paradas si la carrera está dentro de la temporada seleccionada
            if (raceMap.containsKey(p.getRaceId())) {
                pitCount.merge(p.getRaceId(), 1, Integer::sum);  // Incrementamos el contador de paradas
            }
        }

        // Ordenar las carreras por su número de vuelta
        List<Map.Entry<Long, Integer>> sorted = pitCount.entrySet().stream()
                .sorted(Comparator.comparing(e -> raceMap.get(e.getKey()).getRound()))  // Ordenar por el orden de la carrera
                .collect(Collectors.toList());

        // Preparar las etiquetas y valores de las paradas
        List<String> labels = sorted.stream()
                .map(e -> raceMap.get(e.getKey()).getName())  // Usamos el nombre de la carrera
                .collect(Collectors.toList());

        List<Double> values = sorted.stream()
                .map(e -> (double) e.getValue())  // Convertimos los valores a Double
                .collect(Collectors.toList());

        // Devolver los datos calculados en el DTO adecuado
        return new ChartDataDTO("Paradas por carrera (" + year + ")", "bar", labels,
                List.of(new ChartSeriesDTO("Paradas en boxes", "#ff8042", values)));
    }



    @Override
    public ChartDataDTO getAvgPitStopsPerSeason() {
        Map<Long, Integer> raceYears = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        Map<Integer, Integer> yearCounts = new HashMap<>();
        Map<Integer, Integer> yearPits = new HashMap<>();

        for (PitStop p : pitStopDao.findAll()) {
            Integer year = raceYears.get(p.getRaceId());
            if (year != null) {
                yearCounts.merge(year, 1, Integer::sum);
                yearPits.merge(year, 1, Integer::sum);
            }
        }

        List<Integer> years = yearPits.keySet().stream().sorted().toList();
        List<String> labels = years.stream().map(String::valueOf).toList();
        List<Double> values = years.stream()
                .map(y -> yearPits.get(y) / (double) yearCounts.getOrDefault(y, 1))
                .toList();

        return new ChartDataDTO("Promedio de paradas por temporada", "line", labels,
                List.of(new ChartSeriesDTO("Pit stops promedio", "#8884d8", values)));
    }


    @Override
    public ChartDataDTO getOvertakesPerRace(String yearStr) {
        int year = Integer.parseInt(yearStr);
        Map<Long, Race> raceMap = raceDao.findAll().stream()
                .filter(r -> r.getYear() == year)
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        Map<Long, Integer> overtakeMap = new HashMap<>();

        // Mapa para almacenar las posiciones de cada piloto por carrera y vuelta
        Map<Long, Map<Integer, Integer>> driverPositions = new HashMap<>();

        // Recorremos todos los tiempos de vuelta
        for (LapTime lapTime : lapTimeDao.findAll()) {
            Long driverId = lapTime.getDriverId();
            Long raceId = lapTime.getRaceId();
            Integer lapNumber = lapTime.getLap();
            Integer position = lapTime.getPosition();

            if (raceMap.containsKey(raceId) && position != null) {
                // Inicializamos el mapa de posiciones si es la primera vez que vemos al piloto
                driverPositions.computeIfAbsent(driverId, k -> new HashMap<>());
                Map<Integer, Integer> positions = driverPositions.get(driverId);

                // Si no tenemos la posición para esta vuelta, la asignamos
                if (!positions.containsKey(lapNumber)) {
                    positions.put(lapNumber, position);
                } else {
                    // Comprobamos si la posición ha cambiado respecto a la vuelta anterior
                    if (positions.containsKey(lapNumber - 1)) {
                        int previousPosition = positions.get(lapNumber - 1);

                        // Solo contamos el adelantamiento si la posición ha cambiado (es menor la nueva)
                        if (position < previousPosition) {
                            // Incrementamos el contador de adelantamientos para la carrera
                            overtakeMap.merge(raceId, 1, Integer::sum);
                        }
                    }

                    // Actualizamos la posición para la vuelta actual
                    positions.put(lapNumber, position);
                }
            }
        }

        // Aseguramos que todas las carreras estén en el mapa, incluso si no hubo adelantamientos
        for (Long raceId : raceMap.keySet()) {
            overtakeMap.putIfAbsent(raceId, 0);
        }

        // Ordenamos las carreras por número de ronda
        List<Map.Entry<Long, Integer>> sorted = overtakeMap.entrySet().stream()
                .sorted(Comparator.comparing(e -> raceMap.get(e.getKey()).getRound()))
                .collect(Collectors.toList());

        // Preparamos las etiquetas para las carreras
        List<String> labels = sorted.stream()
                .map(e -> raceMap.get(e.getKey()).getName())
                .collect(Collectors.toList());

        // Preparamos los valores de los adelantamientos
        List<Double> values = sorted.stream()
                .map(e -> (double) e.getValue())
                .collect(Collectors.toList());

        // Devolvemos los datos para la gráfica
        return new ChartDataDTO("Cambios de Posición por carrera (" + year + ")", "bar", labels,
                List.of(new ChartSeriesDTO("Cambios de Posición", "#00c49f", values)));
    }








    @Override
    public ChartDataDTO getAvgOvertakesPerSeason() {
        Map<Long, Integer> raceYears = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        Map<Integer, Integer> yearTotal = new HashMap<>();
        Map<Integer, Integer> yearCount = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            Integer year = raceYears.get(r.getRace().getRaceId());
            if (year == null || r.getGrid() == null || r.getPositionOrder() == null) continue;

            if (r.getGrid() > r.getPositionOrder()) {
                yearTotal.merge(year, 1, Integer::sum);
            }
            yearCount.merge(year, 1, Integer::sum);
        }

        List<Integer> years = yearTotal.keySet().stream().sorted().toList();
        List<String> labels = years.stream().map(String::valueOf).toList();
        List<Double> values = years.stream()
                .map(y -> yearTotal.get(y) / (double) yearCount.getOrDefault(y, 1))
                .toList();

        return new ChartDataDTO("Promedio de adelantamientos por temporada", "line", labels,
                List.of(new ChartSeriesDTO("Adelantamientos promedio", "#0088fe", values)));
    }


    @Override
    public ChartDataDTO getPointsDeltaVsTeammate(String seasonStr) {
        int season = Integer.parseInt(seasonStr);

        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Obtener solo las carreras de esa temporada
        Set<Long> raceIds = raceDao.findAll().stream()
                .filter(r -> r.getYear() == season)
                .map(Race::getRaceId)
                .collect(Collectors.toSet());

        // Map<driverId, List<delta vs teammate>>
        Map<Long, List<Double>> deltas = new HashMap<>();

        Map<Long, List<Result>> resultsByRace = resultDao.findAll().stream()
                .filter(r -> raceIds.contains(r.getRace().getRaceId()))
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));

        for (Map.Entry<Long, List<Result>> raceEntry : resultsByRace.entrySet()) {
            List<Result> raceResults = raceEntry.getValue();

            Map<Long, List<Result>> byConstructor = raceResults.stream()
                    .filter(r -> r.getConstructor() != null && r.getDriver() != null && r.getPoints() != null)
                    .collect(Collectors.groupingBy(r -> r.getConstructor().getConstructorId()));

            for (List<Result> teamResults : byConstructor.values()) {
                for (Result a : teamResults) {
                    for (Result b : teamResults) {
                        if (a.getDriver().getDriverId().equals(b.getDriver().getDriverId())) continue;

                        double delta = a.getPoints() - b.getPoints();
                        deltas.computeIfAbsent(a.getDriver().getDriverId(), k -> new ArrayList<>()).add(delta);
                    }
                }
            }
        }

        List<ChartSeriesDTO> seriesList = new ArrayList<>();
        for (Map.Entry<Long, List<Double>> entry : deltas.entrySet()) {
            Long driverId = entry.getKey();
            List<Double> deltaList = entry.getValue();
            double avgDelta = deltaList.stream().mapToDouble(d -> d).average().orElse(0.0);

            String label = driverMap.containsKey(driverId)
                    ? driverMap.get(driverId).getForename() + " " + driverMap.get(driverId).getSurname()
                    : "Driver " + driverId;

            seriesList.add(new ChartSeriesDTO(label, "#8884d8", List.of(avgDelta)));
        }

        return new ChartDataDTO(
                "Diferencia media de puntos vs compañero (" + season + ")",
                "bar",
                List.of("Δ puntos"),
                seriesList
        );
    }

}
