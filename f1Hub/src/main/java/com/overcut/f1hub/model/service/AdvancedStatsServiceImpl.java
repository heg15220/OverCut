package com.overcut.f1hub.model.service;

import com.overcut.f1hub.model.entities.*;
import com.overcut.f1hub.rest.dtos.ChartDataDTO;
import com.overcut.f1hub.rest.dtos.ChartSeriesDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
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

    @Autowired
    private CircuitDao circuitDao;

    @Autowired
    private ChartI18nService chartI18n;

    @Autowired
    private SprintResultDao sprintResultDao;

    public List<DriverOption> getAllDrivers() {
        return driverDao.findAll().stream()
                .sorted(Comparator.comparing(d -> d.getForename() + d.getSurname())) // Ordenar por nombre + apellido
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
                .sorted(Comparator.reverseOrder()) // Orden descendente
                .collect(Collectors.toList());
    }

    @Override
    public List<CircuitOption> getAllCircuits() {
        return circuitDao.findAll().stream()
                .sorted(Comparator.comparing(Circuit::getName))
                .map(c -> new CircuitOption(c.getCircuitRef(), c.getCircuitRef()))
                .collect(Collectors.toList());
    }



    public ChartDataDTO getAveragePointsPerSeasonByDriver(String decade, String lang) {
        int startYear = 1950, endYear = 2050;
        if (decade != null) {
            switch (decade) {
                case "1980s" -> { startYear = 1980; endYear = 1989; }
                case "1990s" -> { startYear = 1990; endYear = 1999; }
                case "2000s" -> { startYear = 2000; endYear = 2009; }
                case "2010s" -> { startYear = 2010; endYear = 2019; }
                case "2020s" -> { startYear = 2020; endYear = 2029; }
            }
        }

        List<Object[]> results = resultDao.getAveragePointsPerSeasonByDriver(startYear, endYear);

        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(d -> d.getDriverId(), d -> d.getForename() + " " + d.getSurname()));

        Map<Integer, Boolean> allYears = new TreeMap<>();
        Map<Long, Map<Integer, Double>> dataMap = new HashMap<>();

        for (Object[] row : results) {
            Long driverId = (Long) row[0];
            Integer year = (Integer) row[1];
            Double avgPoints = (Double) row[2];

            allYears.put(year, true);
            dataMap.computeIfAbsent(driverId, k -> new HashMap<>()).put(year, avgPoints);
        }

        List<String> yearLabels = allYears.keySet().stream().map(String::valueOf).toList();
        List<ChartSeriesDTO> datasets = new ArrayList<>();

        for (Map.Entry<Long, Map<Integer, Double>> entry : dataMap.entrySet()) {
            Long driverId = entry.getKey();
            String label = driverNames.getOrDefault(driverId, "Driver " + driverId);
            List<Double> data = new ArrayList<>();

            boolean hasNonZero = false;
            for (Integer y : allYears.keySet()) {
                Double val = entry.getValue().get(y);
                data.add(val);
                if (val != null && val > 0) hasNonZero = true;
            }

            if (hasNonZero) {
                datasets.add(new ChartSeriesDTO(label, "#8884d8", data));
            }
        }

        return new ChartDataDTO(chartI18n.get("averagePointsPerSeason", lang), "line", yearLabels, datasets);
    }




    //Is called getVictoryPercentageByDriverPerSeason but refers to wins percentage by DECADE, not season
    public ChartDataDTO getVictoryPercentageByDriverPerSeason(String decade, String lang) {
        // Extraer el año de inicio y fin de la década
        int decadeStart = Integer.parseInt(decade.substring(0, 4));
        int decadeEnd = decadeStart + 9;

        // Paso 1: Obtener todos los pilotos que participaron en la década seleccionada
        List<Driver> driversInDecade = driverDao.findDriversByDecade(decadeStart, decadeEnd);

        // Paso 2: Listas para almacenar los resultados del gráfico
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();

        // Paso 3: Iterar sobre cada piloto para calcular sus victorias y total de carreras
        for (Driver driver : driversInDecade) {
            Long driverId = driver.getDriverId();
            String forename = driver.getForename();
            String surname = driver.getSurname();

            // Paso 4: Contar las victorias de este piloto en la década
            long wins = resultDao.countWinsByDriverAndYear(driverId, decadeStart, decadeEnd);

            // Paso 5: Contar las carreras disputadas en la década para este piloto
            long totalRaces = resultDao.countRacesInDecade(decadeStart, decadeEnd);

            // Paso 6: Calcular el porcentaje de victorias
            double winPercentage = (totalRaces > 0) ? (100.0 * wins) / totalRaces : 0.0;

            // Paso 7: Solo agregar pilotos con porcentaje de victorias > 0
            if (winPercentage > 0.0) {
                // Agregar los resultados a las listas de datos
                labels.add(forename + " " + surname); // Nombre completo del piloto
                data.add(winPercentage);
            }
        }

        // Paso 8: Crear el gráfico de datos
        List<ChartSeriesDTO> datasets = new ArrayList<>();
        datasets.add(new ChartSeriesDTO("Wins", labels, data));

        // Paso 9: Preparar el resultado del gráfico
        return new ChartDataDTO(
                chartI18n.get("victoryPercentageByDecade", lang),
                "pie", // Tipo de gráfico circular
                List.of(decade + "s"), // Etiquetas de las décadas
                datasets
        );
    }


    @Override
    public ChartDataDTO getPodiumPercentageVsTeammate(String decade, String lang) {
        int startYear = 0, endYear = 9999;
        if (decade != null) {
            switch (decade) {
                case "1980s": startYear = 1980; endYear = 1989; break;
                case "1990s": startYear = 1990; endYear = 1999; break;
                case "2000s": startYear = 2000; endYear = 2009; break;
                case "2010s": startYear = 2010; endYear = 2019; break;
                case "2020s": startYear = 2020; endYear = 2029; break;
                // Se pueden añadir más décadas si hace falta
            }
        }

        List<PodiumStatsView> rawStats = resultDao.getPodiumsByDriverAndTeamPerYear(startYear, endYear);

        // Map<year, Map<constructorRef, totalTeamPodiums>>
        Map<Integer, Map<String, Long>> teamPodiums = new HashMap<>();
        Map<Integer, Set<Integer>> allYears = new HashMap<>();

        for (PodiumStatsView stat : rawStats) {
            int year = stat.getYear();
            String team = stat.getConstructorRef();
            teamPodiums
                    .computeIfAbsent(year, y -> new HashMap<>())
                    .merge(team, stat.getPodiums(), Long::sum);

            allYears.computeIfAbsent(year, y -> new HashSet<>()).add(year);
        }

        // Agrupar por piloto
        Map<Long, Map<Integer, PodiumStatsView>> driverYearData = new HashMap<>();
        for (PodiumStatsView stat : rawStats) {
            driverYearData
                    .computeIfAbsent(stat.getDriverId(), id -> new HashMap<>())
                    .put(stat.getYear(), stat);
        }

        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(
                        Driver::getDriverId,
                        d -> d.getForename() + " " + d.getSurname()
                ));

        // Aseguramos años ordenados
        List<String> labels = new TreeSet<>(allYears.keySet()).stream().map(String::valueOf).toList();
        List<ChartSeriesDTO> seriesList = new ArrayList<>();

        for (Map.Entry<Long, Map<Integer, PodiumStatsView>> entry : driverYearData.entrySet()) {
            Long driverId = entry.getKey();
            Map<Integer, PodiumStatsView> yearData = entry.getValue();

            List<Double> data = new ArrayList<>();
            long totalPodiums = 0;

            for (String yearStr : labels) {
                int year = Integer.parseInt(yearStr);
                PodiumStatsView stat = yearData.get(year);
                if (stat == null) {
                    data.add(null);
                    continue;
                }

                long driverPodiums = stat.getPodiums();
                String constructorRef = stat.getConstructorRef();
                long teamTotal = teamPodiums.getOrDefault(year, Map.of()).getOrDefault(constructorRef, 0L);

                totalPodiums += driverPodiums;
                double perc = teamTotal > 0 ? (100.0 * driverPodiums) / teamTotal : 0.0;
                data.add(perc);
            }

            if (totalPodiums > 0) {
                seriesList.add(new ChartSeriesDTO(driverNames.get(driverId), "#8884d8", data));
            }
        }

        // Línea al 50%
        List<Double> fiftyLine = new ArrayList<>(Collections.nCopies(labels.size(), 50.0));
        seriesList.add(new ChartSeriesDTO("50%", "#999999", fiftyLine));

        return new ChartDataDTO(chartI18n.get("podiumPercentageVsTeammate", lang), "line", labels, seriesList);
    }




    @Override
    public ChartDataDTO getPodiumPercentageTotalVsAllTeammates(String lang) {
        List<Driver> allDrivers = driverDao.findAll();
        List<PodiumLiteView> podiumResults = resultDao.findAllPodiumResultsLite();

        // Paleta de colores extensa
        String[] colorPalette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff",
                "#000000", "#ff7f00", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"
        };

        Map<Long, String> colorMap = new HashMap<>();
        List<Long> driverIds = allDrivers.stream().map(Driver::getDriverId).sorted().toList();
        for (int i = 0; i < driverIds.size(); i++) {
            colorMap.put(driverIds.get(i), colorPalette[i % colorPalette.length]);
        }

        // Map<driverId, Map<year, constructorId>>
        Map<Long, Map<Integer, Long>> driverYearTeamMap = new HashMap<>();
        for (PodiumLiteView p : podiumResults) {
            driverYearTeamMap
                    .computeIfAbsent(p.getDriverId(), k -> new HashMap<>())
                    .putIfAbsent(p.getYear(), p.getConstructorId());
        }

        // Map<driverId, Map<year, count>>
        Map<Long, Map<Integer, Long>> podiumsByDriverYear = podiumResults.stream()
                .collect(Collectors.groupingBy(
                        PodiumLiteView::getDriverId,
                        Collectors.groupingBy(
                                PodiumLiteView::getYear,
                                Collectors.counting()
                        )
                ));

        // Map<constructorId, Map<year, count>>
        Map<Long, Map<Integer, Long>> podiumsByConstructorYear = podiumResults.stream()
                .collect(Collectors.groupingBy(
                        PodiumLiteView::getConstructorId,
                        Collectors.groupingBy(
                                PodiumLiteView::getYear,
                                Collectors.counting()
                        )
                ));

        // Agrupación por %Y → lista de pilotos para distribuir en X
        Map<Double, List<ChartSeriesDTO>> groupedByY = new HashMap<>();

        for (Driver d : allDrivers) {
            Long driverId = d.getDriverId();
            String name = d.getForename() + " " + d.getSurname();
            String abbr = d.getSurname().replaceAll("[^A-Za-z]", "").toUpperCase().substring(0, Math.min(3, d.getSurname().length()));
            String color = colorMap.getOrDefault(driverId, "#cccccc");

            Map<Integer, Long> yearTeamMap = driverYearTeamMap.getOrDefault(driverId, Map.of());
            if (yearTeamMap.isEmpty()) continue;

            double totalDriverPodiums = 0;
            double totalTeamPodiums = 0;

            for (Map.Entry<Integer, Long> e : yearTeamMap.entrySet()) {
                int year = e.getKey();
                Long constructorId = e.getValue();

                long driverPodiums = podiumsByDriverYear
                        .getOrDefault(driverId, Map.of())
                        .getOrDefault(year, 0L);

                long teamPodiums = podiumsByConstructorYear
                        .getOrDefault(constructorId, Map.of())
                        .getOrDefault(year, 0L);

                totalDriverPodiums += driverPodiums;
                totalTeamPodiums += teamPodiums;
            }

            if (totalDriverPodiums > 0 && totalTeamPodiums > 0) {
                double percentage = Math.round((totalDriverPodiums * 100.0 / totalTeamPodiums) * 10.0) / 10.0;

                ChartSeriesDTO dto = new ChartSeriesDTO(name, color, new ArrayList<>());
                dto.setAbbreviation(abbr);

                groupedByY.computeIfAbsent(percentage, k -> new ArrayList<>()).add(dto);
            }
        }

        // Distribución horizontal por nivel Y
        List<ChartSeriesDTO> dataset = new ArrayList<>();

        for (Map.Entry<Double, List<ChartSeriesDTO>> entry : groupedByY.entrySet()) {
            double y = entry.getKey();
            List<ChartSeriesDTO> group = entry.getValue();
            int size = group.size();

            double spreadFactor = 0.75;
            double totalWidth = (size - 1) * spreadFactor;
            double startX = -totalWidth / 2.0;

            for (int i = 0; i < size; i++) {
                double xOffset = startX + i * spreadFactor;
                ChartSeriesDTO dto = group.get(i);
                dto.setData(List.of(xOffset, y));
                dataset.add(dto);
            }
        }

        return new ChartDataDTO(
                chartI18n.get("totalPodiumsVsTeammates", lang),
                "scatter",
                List.of("Y: % Podiums vs team, X: horizontal distribution"),
                dataset
        );
    }







    @Override
    public ChartDataDTO getQ3PercentageVsTeammate(String driverIdStr, String lang) {
        Long driverId = Long.parseLong(driverIdStr);
        Driver targetDriver = driverDao.findById(driverId).orElse(null);
        if (targetDriver == null) {
            return new ChartDataDTO("Piloto no encontrado", "line", List.of(), List.of());
        }

        String forename = targetDriver.getForename();
        String surname = targetDriver.getSurname();

        List<Qualifying> filteredQualis = qualifyingDao.findByDriverWithConstructorAndRace(driverId);

        Map<Integer, String> yearToConstructorRef = filteredQualis.stream()
                .collect(Collectors.groupingBy(
                        q -> q.getRace().getYear(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> list.get(0).getConstructor().getConstructorRef()
                        )
                ));


        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();

        for (Map.Entry<Integer, String> entry : yearToConstructorRef.entrySet()) {
            int year = entry.getKey();
            String constructorRef = entry.getValue();

            long driverQCount;
            long teamTotalQCount;

            if (year < 2006) {
                // Pre-2006: usamos Q1 como proxy de clasificación
                driverQCount = qualifyingDao.countByDriverAndQ1NotNull(forename, surname, year);
                teamTotalQCount = qualifyingDao.countByConstructorAndQ1NotNull(constructorRef, year);
            } else {
                // Desde 2006: usamos Q3 como siempre
                driverQCount = qualifyingDao.countQ3ByDriverInYear(forename, surname, year);
                teamTotalQCount = qualifyingDao.countQ3ByConstructorInYear(constructorRef, year)
                        .stream()
                        .mapToLong(obj -> (Long) obj[2])
                        .sum();
            }

            double percentage = (teamTotalQCount == 0) ? 0.0 : (100.0 * driverQCount) / teamTotalQCount;
            labels.add(String.valueOf(year));
            data.add(percentage);
        }

        String driverName = forename + " " + surname;
        List<Double> fiftyLine = new ArrayList<>(Collections.nCopies(data.size(), 50.0));

        return new ChartDataDTO(
                chartI18n.get("q3PercentageVsTeammate", lang) + driverName,
                "line",
                labels,
                List.of(
                        new ChartSeriesDTO(driverName, "#ff7f50", data),
                        new ChartSeriesDTO("50%", "#999999", fiftyLine)
                )
        );
    }





    @Override
    public ChartDataDTO getAverageAccidentsBySeason(String lang) {
        Map<Integer, Long> accidents = statusDao.getAccidentCountsBySeason().stream()
                .collect(Collectors.toMap(AccidentStatView::getYear, AccidentStatView::getCount));

        Map<Integer, Long> races = raceDao.getRaceCountByYear().stream()
                .collect(Collectors.toMap(YearCountView::getYear, YearCountView::getCount));

        List<Integer> years = new ArrayList<>(races.keySet());
        Collections.sort(years);

        List<String> labels = years.stream().map(String::valueOf).toList();
        List<Double> data = years.stream()
                .map(y -> (accidents.getOrDefault(y, 0L) * 1.0) / races.getOrDefault(y, 1L))
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgAccidentsPerSeason", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Accidents per race", "#ff7300", data))
        );
    }


    @Override
    public ChartDataDTO getAverageRetirementsBySeason(String lang) {
        Map<Integer, Long> retirements = resultDao.getRetirementCountsBySeason().stream()
                .collect(Collectors.toMap(RetirementStatView::getYear, RetirementStatView::getCount));
        Map<Integer, Long> races = raceDao.getRaceCountByYear().stream()
                .collect(Collectors.toMap(YearCountView::getYear, YearCountView::getCount));

        List<Integer> years = new ArrayList<>(retirements.keySet());
        Collections.sort(years);

        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();

        for (Integer year : years) {
            long ret = retirements.getOrDefault(year, 0L);
            long rac = races.getOrDefault(year, 1L);
            labels.add(String.valueOf(year));
            values.add((double) ret / rac);
        }

        return new ChartDataDTO(
                chartI18n.get("avgRetirementsPerSeason", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Retirements per race", "#cc0000", values))
        );
    }



    @Override
    public ChartDataDTO getAvgPositionsGainedFirstLaps(String lang) {
        List<Lap2GainView> lapGains = resultDao.getLap2GainsLite();
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, List<Integer>> gains = new HashMap<>();
        for (Lap2GainView g : lapGains) {
            int delta = g.getGrid() - g.getLap2Position();
            gains.computeIfAbsent(g.getDriverId(), k -> new ArrayList<>()).add(delta);
        }

        // Paleta de colores
        String[] colorPalette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff",
                "#000000", "#ff7f00", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"
        };

        Map<Long, String> colorMap = new HashMap<>();
        List<Long> driverIds = new ArrayList<>(gains.keySet());
        Collections.sort(driverIds);
        for (int i = 0; i < driverIds.size(); i++) {
            colorMap.put(driverIds.get(i), colorPalette[i % colorPalette.length]);
        }

        // Agrupar por valor Y (promedio redondeado)
        Map<Double, List<ChartSeriesDTO>> groupedByY = new HashMap<>();
        for (Long driverId : driverIds) {
            List<Integer> deltas = gains.get(driverId);
            double avgGain = Math.round(deltas.stream().mapToDouble(i -> i).average().orElse(0.0) * 10.0) / 10.0;

            Driver d = driverMap.get(driverId);
            if (d == null) continue;

            String label = d.getForename() + " " + d.getSurname();
            String abbr = d.getSurname().replaceAll("[^A-Za-z]", "").toUpperCase().substring(0, Math.min(3, d.getSurname().length()));
            String color = colorMap.getOrDefault(driverId, "#cccccc");

            ChartSeriesDTO dto = new ChartSeriesDTO(label, color, new ArrayList<>());
            dto.setAbbreviation(abbr);

            groupedByY.computeIfAbsent(avgGain, k -> new ArrayList<>()).add(dto);
        }

        // Asignar coordenadas [X, Y]
        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (Map.Entry<Double, List<ChartSeriesDTO>> entry : groupedByY.entrySet()) {
            double y = entry.getKey();
            List<ChartSeriesDTO> group = entry.getValue();
            int n = group.size();

            for (int i = 0; i < n; i++) {
                double xOffset = i - (n - 1) / 2.0;
                ChartSeriesDTO dto = group.get(i);
                dto.setData(List.of(xOffset, y));
                dataset.add(dto);
            }
        }

        return new ChartDataDTO(
                chartI18n.get("avgPositionsGainedAfter2Laps", lang),
                "scatter",
                List.of("Average in Y axis, dispersion on the X axis"),
                dataset
        );
    }






    @Override
    public ChartDataDTO getAvgPositionsGainedBySeason(String driverIdStr, String lang) {
        Long driverId = Long.parseLong(driverIdStr);

        List<ResultDeltaView> deltas = resultDao.findGridDeltasByDriver(driverId);

        // Map<year, List<deltas>>
        Map<Integer, List<Integer>> gains = new HashMap<>();

        for (ResultDeltaView r : deltas) {
            int delta = r.getGrid() - r.getPositionOrder();
            gains.computeIfAbsent(r.getYear(), y -> new ArrayList<>()).add(delta);
        }

        List<Integer> sortedYears = gains.keySet().stream().sorted().toList();
        List<String> labels = sortedYears.stream().map(String::valueOf).toList();
        List<Double> data = sortedYears.stream()
                .map(y -> gains.get(y).stream().mapToInt(i -> i).average().orElse(0))
                .toList();

        Driver driver = driverDao.findById(driverId).orElse(null);
        String label = (driver != null)
                ? driver.getForename() + " " + driver.getSurname()
                : "Driver " + driverId;

        ChartSeriesDTO series = new ChartSeriesDTO(label, "#8884d8", data);

        return new ChartDataDTO(
                chartI18n.get("avgPositionsGainedBySeason", lang) + label,
                "line", labels, List.of(series)
        );
    }



    @Override
    public ChartDataDTO getQualiVsTeammateComparison(String driverIdStr, String lang) {
        Long driverId = Long.parseLong(driverIdStr);

        Driver targetDriver = driverDao.findById(driverId).orElse(null);
        if (targetDriver == null) {
            return new ChartDataDTO("Driver not found", "bar", List.of(), List.of());
        }

        List<QualiResultLiteView> allQualis = qualifyingDao.findAllQualifyingLite();

        // Map<raceId, List<QualiResultLiteView>>
        Map<Long, List<QualiResultLiteView>> groupedByRace = allQualis.stream()
                .collect(Collectors.groupingBy(QualiResultLiteView::getRaceId));

        Map<Integer, int[]> seasonStats = new HashMap<>();

        for (List<QualiResultLiteView> qualis : groupedByRace.values()) {
            // Agrupar por constructor
            Map<Long, List<QualiResultLiteView>> byTeam = qualis.stream()
                    .collect(Collectors.groupingBy(QualiResultLiteView::getConstructorId));

            for (List<QualiResultLiteView> teamQualis : byTeam.values()) {
                Optional<QualiResultLiteView> driverQ = teamQualis.stream()
                        .filter(q -> q.getDriverId().equals(driverId))
                        .findFirst();

                if (driverQ.isEmpty()) continue;

                QualiResultLiteView qTarget = driverQ.get();
                Integer year = qTarget.getYear();
                if (year == null || qTarget.getPosition() == null) continue;

                List<QualiResultLiteView> teammates = teamQualis.stream()
                        .filter(q -> !q.getDriverId().equals(driverId))
                        .filter(q -> q.getPosition() != null)
                        .toList();

                for (QualiResultLiteView teammate : teammates) {
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

        String driverName = targetDriver.getForename() + " " + targetDriver.getSurname();

        return new ChartDataDTO(
                chartI18n.get("qualiComparisonVsTeammate", lang) + driverName,
                "bar",
                labels,
                List.of(
                        new ChartSeriesDTO("Wins quali", "#00bcd4", wins),
                        new ChartSeriesDTO("Loses quali", "#ff5722", losses)
                )
        );
    }



    @Override
    public ChartDataDTO getRaceVsTeammateComparison(String driverIdStr, String lang) {
        Long targetDriverId = Long.parseLong(driverIdStr);
        Driver driver = driverDao.findById(targetDriverId).orElse(null);
        String driverName = driver != null ? driver.getForename() + " " + driver.getSurname() : "Driver " + driverIdStr;

        // Paso 1: Obtener resultados mínimos
        List<RaceComparisonLiteView> all = resultDao.getAllResultsForRaceTeammateComparison();

        // Paso 2: Agrupar por carrera
        Map<Long, List<RaceComparisonLiteView>> byRace = all.stream()
                .collect(Collectors.groupingBy(RaceComparisonLiteView::getRaceId));

        // Paso 3: Calcular wins/losses por temporada
        Map<Integer, int[]> seasonStats = new HashMap<>();

        for (List<RaceComparisonLiteView> raceResults : byRace.values()) {
            // Agrupar por equipo
            Map<Long, List<RaceComparisonLiteView>> byConstructor = raceResults.stream()
                    .collect(Collectors.groupingBy(RaceComparisonLiteView::getConstructorId));

            for (List<RaceComparisonLiteView> teamResults : byConstructor.values()) {
                Optional<RaceComparisonLiteView> mainOpt = teamResults.stream()
                        .filter(r -> r.getDriverId().equals(targetDriverId))
                        .findFirst();

                if (mainOpt.isEmpty()) continue;

                RaceComparisonLiteView main = mainOpt.get();
                int year = main.getYear();
                int pos = main.getPositionOrder();

                List<RaceComparisonLiteView> teammates = teamResults.stream()
                        .filter(r -> !r.getDriverId().equals(targetDriverId))
                        .toList();

                for (RaceComparisonLiteView teammate : teammates) {
                    int[] stats = seasonStats.computeIfAbsent(year, y -> new int[2]);
                    if (pos < teammate.getPositionOrder()) {
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

        return new ChartDataDTO(
                chartI18n.get("raceComparisonVsTeammate", lang) + " " + driverName,
                "bar",
                labels,
                List.of(
                        new ChartSeriesDTO("Wins", "#00C49F", wins),
                        new ChartSeriesDTO("Loses", "#FF8042", losses)
                )
        );
    }



    @Override
    public ChartDataDTO getWinsFrom3rdOrWorse(String lang) {
        List<PodiumFromP3View> raw = resultDao.getWinsFrom3rdOrWorse();
        Map<Long, Integer> winMap = raw.stream()
                .collect(Collectors.toMap(PodiumFromP3View::getDriverId, PodiumFromP3View::getCount));

        List<Driver> drivers = driverDao.findByDriverIds(winMap.keySet());

        String[] colors = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#25CCF7",
                "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2", "#218c74", "#40407a", "#ffb142", "#706fd3",
                "#ff5252", "#2C3A47", "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5"
        };

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        int i = 0;
        for (Map.Entry<Long, Integer> entry : winMap.entrySet()) {
            Long driverId = entry.getKey();
            Driver d = drivers.stream().filter(dr -> dr.getDriverId().equals(driverId)).findFirst().orElse(null);
            String label = (d != null) ? d.getForename() + " " + d.getSurname() : "Driver " + driverId;
            dataset.add(new ChartSeriesDTO(label, colors[i++ % colors.length], List.of(entry.getValue().doubleValue())));
        }

        return new ChartDataDTO(chartI18n.get("winsFromP3OrWorse", lang), "bar", List.of("Wins P3 or worse"), dataset);
    }



    @Override
    public ChartDataDTO getPodiumsFrom3rdOrWorse(String lang) {
        List<PodiumFromP3View> podiums = resultDao.getPodiumsFrom3rdOrWorse();
        Map<Long, Driver> driverMap = driverDao.findByDriverIds(
                podiums.stream().map(PodiumFromP3View::getDriverId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Driver::getDriverId, d -> d));

        String[] colors = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#25CCF7",
                "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2", "#218c74", "#40407a", "#ffb142", "#706fd3",
                "#ff5252", "#2C3A47", "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5"
        };

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        int i = 0;
        for (PodiumFromP3View p : podiums) {
            Driver d = driverMap.get(p.getDriverId());
            String name = (d != null) ? d.getForename() + " " + d.getSurname() : "Driver " + p.getDriverId();
            String color = colors[i % colors.length];
            dataset.add(new ChartSeriesDTO(name, color, List.of(p.getCount().doubleValue())));
            i++;
        }

        return new ChartDataDTO(chartI18n.get("podiumsFromP3OrWorse", lang), "bar", List.of("Podiums P3 or worse"), dataset);
    }


    @Override
    public ChartDataDTO getMostCommonFinishPosition(String lang) {
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
                chartI18n.get("mostCommonFinishPosition", lang),
                "bar",
                List.of("Most common position"),
                dataset
        );
    }


    @Override
    public ChartDataDTO getMostCommonQualiPosition(String lang) {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        List<MostCommonQualiView> rawStats = qualifyingDao.getAllQualiPositionFrequencies();

        // Map<driverId, Map<position, count>>
        Map<Long, Map<Integer, Long>> countMap = new HashMap<>();
        for (MostCommonQualiView stat : rawStats) {
            countMap
                    .computeIfAbsent(stat.getDriverId(), k -> new HashMap<>())
                    .put(stat.getPosition(), stat.getCount());
        }

        // 🎨 Paleta de colores extensa
        String[] colorPalette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff",
                "#000000", "#ff7f00", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"
        };

        List<Long> driverIds = countMap.keySet().stream().sorted().toList();
        Map<Long, String> colorMap = new HashMap<>();
        for (int i = 0; i < driverIds.size(); i++) {
            colorMap.put(driverIds.get(i), colorPalette[i % colorPalette.length]);
        }

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Long>> entry : countMap.entrySet()) {
            Long driverId = entry.getKey();
            Map<Integer, Long> posMap = entry.getValue();

            Optional<Map.Entry<Integer, Long>> mostCommon = posMap.entrySet().stream()
                    .max(Map.Entry.comparingByValue());

            if (mostCommon.isPresent()) {
                Driver driver = driverMap.get(driverId);
                String label = driver != null
                        ? driver.getForename() + " " + driver.getSurname()
                        : "Driver " + driverId;

                String abbr = driver != null
                        ? driver.getSurname().replaceAll("[^A-Za-z]", "").toUpperCase().substring(0, Math.min(3, driver.getSurname().length()))
                        : "UNK";

                String color = colorMap.getOrDefault(driverId, "#cccccc");

                ChartSeriesDTO dto = new ChartSeriesDTO(label, color, List.of((double) mostCommon.get().getKey()));
                dto.setAbbreviation(abbr);
                dataset.add(dto);
            }
        }

        return new ChartDataDTO(
                chartI18n.get("mostCommonQualiPosition", lang),
                "bar",
                List.of("Most common position"),
                dataset
        );
    }




    @Override
    public ChartDataDTO getAvgGapToPolePerSeason(String lang) {
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

        return new ChartDataDTO(chartI18n.get("avgQualiGapToPole", lang), "line", yearLabels, datasets);
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
    public ChartDataDTO getDriverVsTeamChampionshipFinish(String decade, String lang) {
        // Filtro por década con estilo clásico
        int startYear = 0;
        int endYear = 9999;
        if (decade != null) {
            switch (decade) {
                case "1950s":
                    startYear = 1950;
                    endYear = 1959;
                    break;
                case "1960s":
                    startYear = 1960;
                    endYear = 1969;
                    break;
                case "1970s":
                    startYear = 1970;
                    endYear = 1979;
                    break;
                case "1980s":
                    startYear = 1980;
                    endYear = 1989;
                    break;
                case "1990s":
                    startYear = 1990;
                    endYear = 1999;
                    break;
                case "2000s":
                    startYear = 2000;
                    endYear = 2009;
                    break;
                case "2010s":
                    startYear = 2010;
                    endYear = 2019;
                    break;
                case "2020s":
                    startYear = 2020;
                    endYear = 2029;
                    break;
                case "2030s":
                    startYear = 2030;
                    endYear = 2039;
                    break;
                case "2040s":
                    startYear = 2040;
                    endYear = 2049;
                    break;
                case "2050s":
                    startYear = 2050;
                    endYear = 2059;
                    break;
                case "2060s":
                    startYear = 2060;
                    endYear = 2069;
                    break;
            }
        }

        List<FinalStandingView> standings = resultDao.getDriverAndTeamPositionsAtSeasonEnd(startYear, endYear);

        Map<Long, Integer> matches = new HashMap<>();
        for (FinalStandingView f : standings) {
            if (f.getDriverPos() <= f.getConstructorPos()) {
                matches.merge(f.getDriverId(), 1, Integer::sum);
            }
        }

        Map<Long, Driver> driverMap = driverDao.findByDriverIds(matches.keySet()).stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        int i = 0;
        for (Map.Entry<Long, Integer> entry : matches.entrySet()) {
            Driver d = driverMap.get(entry.getKey());
            String label = (d != null) ? d.getForename() + " " + d.getSurname() : "Driver " + entry.getKey();
            dataset.add(new ChartSeriesDTO(label, getColorForIndex(i++), List.of(entry.getValue().doubleValue())));
        }

        String title = chartI18n.get("driverVsTeamChampionshipFinish", lang) + " (" + startYear + "s)";
        return new ChartDataDTO(title, "bar", List.of("Times"), dataset);
    }



    // 🎨 Paleta extensa
    String[] colorPalette = {
            "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
            "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
            "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff",
            "#000000", "#ff7f00", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"
    };


    @Override
    public ChartDataDTO getWinsWithoutTop2(String lang) {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        List<ConstructorWinsView> rawData = resultDao.getWinsFromP3OrLower();

        String[] colorPalette = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1",
                "#F8EFBA", "#25CCF7", "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2",
                "#218c74", "#40407a", "#ffb142", "#706fd3", "#ff5252", "#2C3A47",
                "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5",
                "#c56cf0", "#ff3838", "#70a1ff", "#2ed573", "#5352ed", "#ff6b81",
                "#1e90ff", "#ffeaa7", "#2f3542", "#1abc9c", "#9b59b6", "#f39c12"
        };

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (int i = 0; i < rawData.size(); i++) {
            ConstructorWinsView stat = rawData.get(i);
            String label = constructorMap.getOrDefault(stat.getConstructorId(), new Constructor()).getName();
            String color = colorPalette[i % colorPalette.length];
            dataset.add(new ChartSeriesDTO(label, color, List.of(stat.getWins().doubleValue())));
        }

        return new ChartDataDTO(
                chartI18n.get("winsWithoutTop2", lang),
                "bar",
                List.of("Wins from P3+"),
                dataset
        );
    }




    // Implementación
    @Override
    public ChartDataDTO getTeamComebacksBySeason(String decade, String lang) {
        int startYear = 0, endYear = 9999;
        if (decade != null) {
            switch (decade) {
                case "1980s": startYear = 1980; endYear = 1989; break;
                case "1990s": startYear = 1990; endYear = 1999; break;
                case "2000s": startYear = 2000; endYear = 2009; break;
                case "2010s": startYear = 2010; endYear = 2019; break;
                case "2020s": startYear = 2020; endYear = 2029; break;
                case "2030s": startYear = 2030; endYear = 2039; break;
                case "2040s": startYear = 2040; endYear = 2049; break;
                case "2050s": startYear = 2050; endYear = 2059; break;
                case "2060s": startYear = 2060; endYear = 2069; break;
            }
        }

        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        // 🔁 Obtener solo las columnas necesarias para la década seleccionada
        List<TeamDeltaView> results = resultDao.getGridVsFinishByConstructor(startYear, endYear);

        // Map<constructorId, Map<year, List<delta>>>
        Map<Long, Map<Integer, List<Integer>>> data = new HashMap<>();

        for (TeamDeltaView view : results) {
            Long constructorId = view.getConstructorId();
            Integer year = view.getYear();
            int delta = view.getGrid() - view.getPositionOrder();

            data.computeIfAbsent(constructorId, k -> new HashMap<>())
                    .computeIfAbsent(year, y -> new ArrayList<>())
                    .add(delta);
        }

        // Obtener todos los años en orden
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
                if (deltas.isEmpty()) {
                    values.add(null);
                } else {
                    double avg = deltas.stream().mapToInt(i -> i).average().orElse(0.0);
                    values.add(avg);
                }
            }
            datasets.add(new ChartSeriesDTO(label, "#8884d8", values));
        }

        return new ChartDataDTO(
                chartI18n.get("teamComebacksBySeason", lang),
                "line",
                labels,
                datasets
        );
    }




    @Override
    public ChartDataDTO getMostTeamPoints(String lang) {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        List<TeamPointsView> rawStats = resultDao.getTotalPointsByConstructor();

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = rawStats.stream()
                .sorted((a, b) -> Double.compare(b.getTotalPoints(), a.getTotalPoints()))
                .map(stat -> {
                    String label = constructorMap.getOrDefault(stat.getConstructorId(), new Constructor()).getName();
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(label, color, List.of(stat.getTotalPoints()));
                })
                .toList();

        return new ChartDataDTO(
                chartI18n.get("totalPointsByTeam", lang),
                "bar",
                List.of("Total points"),
                dataset
        );
    }




    @Override
    public ChartDataDTO getAvgPointsPerTeamPerSeason(String decade, String lang) {
        int startYear = 0, endYear = 9999;
        if (decade != null) {
            switch (decade) {
                case "1980s": startYear = 1980; endYear = 1989; break;
                case "1990s": startYear = 1990; endYear = 1999; break;
                case "2000s": startYear = 2000; endYear = 2009; break;
                case "2010s": startYear = 2010; endYear = 2019; break;
                case "2020s": startYear = 2020; endYear = 2029; break;
                case "2030s": startYear = 2030; endYear = 2039; break;
                case "2040s": startYear = 2040; endYear = 2049; break;
                case "2050s": startYear = 2050; endYear = 2059; break;
                case "2060s": startYear = 2060; endYear = 2069; break;
            }
        }

        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        List<TeamPointsYearView> results = resultDao.getPointsPerConstructorPerYear(startYear, endYear);

        // Map<constructorId, Map<year, points>>
        Map<Long, Map<Integer, Double>> data = new HashMap<>();
        Set<Integer> allYears = new TreeSet<>();

        for (TeamPointsYearView view : results) {
            Long constructorId = view.getConstructorId();
            Integer year = view.getYear();
            Double points = view.getPoints();

            allYears.add(year);
            data.computeIfAbsent(constructorId, k -> new HashMap<>())
                    .put(year, points);
        }

        List<String> labels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Double>> entry : data.entrySet()) {
            Long constructorId = entry.getKey();
            String label = constructorMap.getOrDefault(constructorId, new Constructor()).getName();
            Map<Integer, Double> yearPoints = entry.getValue();

            List<Double> values = new ArrayList<>();
            for (Integer year : allYears) {
                values.add(yearPoints.getOrDefault(year, null));
            }

            datasets.add(new ChartSeriesDTO(label, "#82ca9d", values));
        }

        return new ChartDataDTO(
                chartI18n.get("avgPointsByTeamPerSeason", lang),
                "line",
                labels,
                datasets
        );
    }




    @Override
    public ChartDataDTO getPitStopsPerRace(String yearStr, String lang) {
        int year = Integer.parseInt(yearStr);
        List<PitStopsRaceView> stats = pitStopDao.getPitStopsByRaceForYear(year);

        // Ordenar por ronda
        stats.sort(Comparator.comparing(PitStopsRaceView::getRound));

        List<String> labels = stats.stream().map(PitStopsRaceView::getRaceName).toList();
        List<Double> values = stats.stream().map(s -> s.getCount().doubleValue()).toList();

        return new ChartDataDTO(
                chartI18n.get("pitStopsPerRace", lang) + " " + year,
                "bar",
                labels,
                List.of(new ChartSeriesDTO("Times on pit lane", "#ff8042", values))
        );
    }



    @Override
    public ChartDataDTO getAvgPitStopsPerSeason(String lang) {
        List<AvgPitStopsSeasonView> stats = pitStopDao.getAvgPitStopsPerSeason();

        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();

        stats.stream().sorted(Comparator.comparing(AvgPitStopsSeasonView::getYear)).forEach(s -> {
            int year = s.getYear();
            long pits = s.getPitCount();
            long races = s.getRaceCount();
            double avg = (races == 0) ? 0.0 : (double) pits / races;

            labels.add(String.valueOf(year));
            values.add(avg);
        });

        return new ChartDataDTO(
                chartI18n.get("avgPitStopsPerSeason", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Pit stops promedio por carrera", "#8884d8", values))
        );
    }




    @Override
    public ChartDataDTO getOvertakesPerRace(String yearStr, String lang) {
        int year = Integer.parseInt(yearStr);

        // Usamos la consulta personalizada para obtener las carreras ordenadas por ronda
        List<Race> races = raceDao.findByYearOrderByRoundAsc(year);
        Map<Long, Race> raceMap = races.stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

        Map<Long, Integer> overtakeMap = new HashMap<>();

        // Mapa para almacenar las posiciones de cada piloto por carrera y vuelta
        Map<Long, Map<Integer, Integer>> driverPositions = new HashMap<>();

        // Obtener los tiempos de vuelta de las carreras seleccionadas (en vez de findAll())
        List<LapTimeSimpleView> lapTimes = lapTimeDao.findSimpleLapTimesByRaceIds(raceMap.keySet());

        // Recorremos todos los tiempos de vuelta
        for (LapTimeSimpleView lapTime : lapTimes) {
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
            overtakeMap.putIfAbsent(raceId, 0);  // Asegura que la carrera esté en el mapa con valor 0 si no hubo adelantamientos
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
        return new ChartDataDTO(chartI18n.get("overtakesPerRace", lang) +  year , "bar", labels,
                List.of(new ChartSeriesDTO("Position changes", "#00c49f", values)));
    }


    @Override
    public ChartDataDTO getAvgOvertakesPerSeason(String lang) {
        // Mapeamos las carreras por su año
        Map<Long, Integer> raceYears = raceDao.findAllOrderByYearAndRound().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Mapa para almacenar los adelantamientos totales por temporada y el conteo de carreras
        Map<Integer, Integer> yearTotal = new HashMap<>();  // Usar Integer para 'year'
        Map<Integer, Integer> yearCount = new HashMap<>();  // Usar Integer para 'year'

        // Usamos la consulta personalizada para obtener los tiempos de vuelta de las carreras
        List<LapTime> lapTimes = lapTimeDao.findByRaceIdIn(raceYears.keySet());

        // Mapa para almacenar las posiciones de cada piloto por carrera y vuelta
        Map<Integer, Map<Long, Map<Integer, Integer>>> driverPositions = new HashMap<>();  // Cambié a Integer para year

        // Recorremos todos los tiempos de vuelta
        for (LapTime lapTime : lapTimes) {
            Long driverId = lapTime.getDriverId();
            Long raceId = lapTime.getRaceId();
            Integer lapNumber = lapTime.getLap();
            Integer position = lapTime.getPosition();

            // Cambié el tipo de 'year' a Integer para que coincida con el tipo esperado
            Integer year = raceYears.get(raceId);  // Mantener Integer aquí
            if (year == null || position == null) continue;

            // Inicializamos el mapa de posiciones para cada piloto y carrera si es la primera vez que vemos al piloto
            driverPositions.computeIfAbsent(year, k -> new HashMap<>());
            driverPositions.get(year).computeIfAbsent(raceId, k -> new HashMap<>());

            Map<Integer, Integer> positions = driverPositions.get(year).get(raceId);

            // Si no tenemos la posición para esta vuelta, la asignamos
            if (!positions.containsKey(lapNumber)) {
                positions.put(lapNumber, position);
            } else {
                // Comprobamos si la posición ha cambiado respecto a la vuelta anterior
                if (positions.containsKey(lapNumber - 1)) {
                    int previousPosition = positions.get(lapNumber - 1);

                    // Solo contamos el adelantamiento si la posición ha cambiado (es menor la nueva)
                    if (position < previousPosition) {
                        // Incrementamos el contador de adelantamientos para esta temporada
                        yearTotal.merge(year, 1, Integer::sum);
                    }
                }

                // Actualizamos la posición para la vuelta actual
                positions.put(lapNumber, position);
            }

            // Incrementamos el contador de carreras procesadas para la temporada
            yearCount.merge(year, 1, Integer::sum);
        }

        // Preparamos las etiquetas para los años
        List<Integer> years = new ArrayList<>(yearTotal.keySet());
        years.sort(Comparator.naturalOrder()); // Ordenamos los años
        List<String> labels = years.stream().map(String::valueOf).toList();

        // Preparamos los valores de los adelantamientos promedio por temporada
        List<Double> values = years.stream()
                .map(y -> yearTotal.get(y) / (double) yearCount.getOrDefault(y, 1))
                .toList();

        // Devolvemos los datos para la gráfica
        return new ChartDataDTO(chartI18n.get("avgOvertakesPerSeason", lang), "line", labels,
                List.of(new ChartSeriesDTO("Average change of positions", "#0088fe", values)));
    }


    @Override
    public ChartDataDTO getPointsDeltaVsTeammate(String seasonStr, String lang) {
        int season = Integer.parseInt(seasonStr);

        String[] colorPalette = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1",
                "#F8EFBA", "#25CCF7", "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2",
                "#218c74", "#40407a", "#ffb142", "#706fd3", "#ff5252", "#2C3A47",
                "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5",
                "#c56cf0", "#ff3838", "#70a1ff", "#2ed573", "#5352ed", "#ff6b81",
                "#1e90ff", "#ffeaa7", "#2f3542", "#1abc9c", "#9b59b6", "#f39c12"
        };

        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Obtener resultados optimizados
        List<PointsResultView> seasonResults = resultDao.getPointsByDriverForSeason(season);

        // Agrupar por carrera
        Map<Long, List<PointsResultView>> resultsByRace = seasonResults.stream()
                .collect(Collectors.groupingBy(PointsResultView::getRaceId));

        Map<Long, List<Double>> deltas = new HashMap<>();

        for (List<PointsResultView> raceResults : resultsByRace.values()) {
            // Agrupar por equipo
            Map<Long, List<PointsResultView>> byConstructor = raceResults.stream()
                    .filter(r -> r.getConstructorId() != null && r.getDriverId() != null && r.getPoints() != null)
                    .collect(Collectors.groupingBy(PointsResultView::getConstructorId));

            for (List<PointsResultView> teamResults : byConstructor.values()) {
                double teamPoints = teamResults.stream()
                        .mapToDouble(PointsResultView::getPoints)
                        .sum();

                if (teamPoints == 0.0) continue; // Ignorar equipos sin puntos

                for (PointsResultView a : teamResults) {
                    for (PointsResultView b : teamResults) {
                        if (a.getDriverId().equals(b.getDriverId())) continue;
                        double delta = a.getPoints() - b.getPoints();
                        deltas.computeIfAbsent(a.getDriverId(), k -> new ArrayList<>()).add(delta);
                    }
                }
            }
        }

        List<ChartSeriesDTO> seriesList = new ArrayList<>();
        int colorIndex = 0;

        for (Map.Entry<Long, List<Double>> entry : deltas.entrySet()) {
            Long driverId = entry.getKey();
            double avgDelta = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

            String label = driverMap.containsKey(driverId)
                    ? driverMap.get(driverId).getForename() + " " + driverMap.get(driverId).getSurname()
                    : "Driver " + driverId;

            String color = colorPalette[colorIndex % colorPalette.length];
            colorIndex++;

            seriesList.add(new ChartSeriesDTO(label, color, List.of(avgDelta)));
        }

        return new ChartDataDTO(
                chartI18n.get("pointsDeltaVsTeammate", lang) + season,
                "bar",
                List.of("Δ points"),
                seriesList
        );
    }



    private Long parseTimeToMilliseconds(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return null;
        try {
            String[] parts = timeStr.split(":");
            if (parts.length == 2) {
                double minutes = Double.parseDouble(parts[0]);
                double seconds = Double.parseDouble(parts[1]);
                return (long) ((minutes * 60 + seconds) * 1000);
            } else {
                return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public ChartDataDTO getAverageQualiGapBetween1stAnd2ndPerSeason(String lang) {
        List<QualiGapView> list = qualifyingDao.getAvgGapBetweenP1AndP2PerSeason();

        List<String> labels = list.stream()
                .map(q -> String.valueOf(q.getYear()))
                .toList();

        List<Double> values = list.stream()
                .map(q -> q.getDiff() != null ? q.getDiff().doubleValue() : 0.0)
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgQualiGapP1P2", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap in ms", "#00C49F", values))
        );
    }




    @Override
    public ChartDataDTO getAverageQualiGapBetween10thAndPolePerSeason(String lang) {
        List<QualiGapP10PoleView> list = qualifyingDao.getAvgGapBetweenP10AndPolePerSeason();

        List<String> labels = list.stream()
                .map(v -> String.valueOf(v.getYear()))
                .toList();

        List<Double> values = list.stream()
                .map(v -> v.getDiff() != null ? v.getDiff() : 0.0)
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgQualiGapP10Pole", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap in ms", "#FFBB28", values))
        );
    }


    @Override
    public ChartDataDTO getAverageRaceGapBetween1stAnd2ndPerSeason(String lang) {
        List<RaceGapP1P2View> list = resultDao.getAvgGapBetweenRaceP1AndP2PerSeason();

        List<String> labels = list.stream()
                .map(v -> String.valueOf(v.getYear()))
                .toList();

        List<Double> values = list.stream()
                .map(v -> v.getDiff() != null ? v.getDiff() : 0.0)
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgRaceGapP1P2", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap in ms", "#FF4444", values))
        );
    }


    @Override
    public ChartDataDTO getDistinctGridPositionsFromWhichDriverWon(String lang) {
        List<GridVictoryView> records = resultDao.getWinnersByGridPosition();

        // Agrupamos pilotos por posición de parrilla
        Map<Integer, Set<Long>> gridToDrivers = new HashMap<>();
        Map<Long, GridVictoryView> driverInfoMap = new HashMap<>();

        for (GridVictoryView row : records) {
            gridToDrivers.computeIfAbsent(row.getGrid(), k -> new HashSet<>()).add(row.getDriverId());
            driverInfoMap.putIfAbsent(row.getDriverId(), row);
        }

        // Ordenamos pilotos por nombre
        List<Long> sortedDriverIds = driverInfoMap.keySet().stream()
                .sorted(Comparator.comparing(id -> {
                    GridVictoryView d = driverInfoMap.get(id);
                    return d.getForename() + " " + d.getSurname();
                }))
                .toList();

        // Colores
        String[] palette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080"
        };

        Map<Long, String> driverColors = new HashMap<>();
        for (int i = 0; i < sortedDriverIds.size(); i++) {
            driverColors.put(sortedDriverIds.get(i), palette[i % palette.length]);
        }

        // Eje Y: grid positions
        List<Integer> sortedGrids = gridToDrivers.keySet().stream().sorted().toList();
        List<String> labels = sortedGrids.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> dataset = new ArrayList<>();

        for (Integer grid : sortedGrids) {
            List<Long> drivers = gridToDrivers.get(grid).stream()
                    .sorted(Comparator.comparing(id -> {
                        GridVictoryView d = driverInfoMap.get(id);
                        return d.getForename() + " " + d.getSurname();
                    }))
                    .toList();

            int n = drivers.size();
            for (int i = 0; i < n; i++) {
                Long driverId = drivers.get(i);
                GridVictoryView d = driverInfoMap.get(driverId);

                double xOffset = i - (n - 1) / 2.0;
                double y = grid;
                String name = d.getForename() + " " + d.getSurname();
                String abbr = d.getSurname().replaceAll("[^A-Za-z]", "").toUpperCase()
                        .substring(0, Math.min(3, d.getSurname().length()));

                ChartSeriesDTO dto = new ChartSeriesDTO(name, driverColors.get(driverId), List.of(xOffset, y));
                dto.setAbbreviation(abbr);
                dataset.add(dto);
            }
        }

        return new ChartDataDTO(
                chartI18n.get("gridPositionsFromWhichDriversWon", lang),
                "scatter",
                labels,
                dataset
        );
    }



    @Override
    public ChartDataDTO getFrontRowVictoryRatePerSeason(String lang) {
        List<FrontRowWinRateView> stats = resultDao.getFrontRowWinRatePerYear();

        List<String> labels = stats.stream().map(s -> String.valueOf(s.getYear())).toList();
        List<Double> values = stats.stream()
                .map(s -> {
                    long total = s.getTotalRaces();
                    long wins = s.getFrontRowWins() == null ? 0 : s.getFrontRowWins();
                    return total == 0 ? 0.0 : (double) wins / total;
                })
                .toList();

        ChartSeriesDTO series = new ChartSeriesDTO("Wins from front row", "#2ecc71", values);

        return new ChartDataDTO(
                chartI18n.get("frontRowVictoryRate", lang),
                "line",
                labels,
                List.of(series)
        );
    }



    @Override
    public ChartDataDTO getWinPercentageByDriverAtCircuit(String circuitRef, String lang) {
        List<CircuitWinPercentageView> stats = resultDao.getWinCountsByDriverAtCircuit(circuitRef);

        long totalWins = stats.stream().mapToLong(CircuitWinPercentageView::getWins).sum();

        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();
        List<String> colors = new ArrayList<>();

        for (CircuitWinPercentageView row : stats) {
            String name = row.getForename() + " " + row.getSurname();
            double percentage = (row.getWins() * 100.0) / totalWins;

            labels.add(name);
            values.add(percentage);
            colors.add(getDriverColor(row.getDriverId()));
        }

        ChartSeriesDTO pieSeries = new ChartSeriesDTO("Wins", labels, values);

        return new ChartDataDTO(
                chartI18n.get("winPercentageByDriverAtCircuit", lang) + circuitRef,
                "pie",
                labels,
                List.of(pieSeries)
        );
    }




    @Override
    public ChartDataDTO getPoleWinRateAtCircuit(String circuitRef, String lang) {
        List<PoleWinRateView> winners = resultDao.getWinningGridsAtCircuit(circuitRef);

        if (winners.isEmpty()) {
            return new ChartDataDTO("No wins found for " + circuitRef, "bar", List.of(), List.of());
        }

        long fromPole = winners.stream().filter(w -> w.getGrid() != null && w.getGrid() == 1).count();
        long fromOthers = winners.size() - fromPole;

        ChartSeriesDTO fromPoleSeries = new ChartSeriesDTO("From Pole", "#2ecc71", List.of((double) fromPole));
        ChartSeriesDTO fromBehindSeries = new ChartSeriesDTO("From other position", "#e74c3c", List.of((double) fromOthers));

        return new ChartDataDTO(
                chartI18n.get("poleWinRateAtCircuit", lang) + circuitRef,
                "bar",
                List.of("Wins"),
                List.of(fromPoleSeries, fromBehindSeries)
        );
    }




    @Override
    public ChartDataDTO getChampionshipProgressTop2Drivers(String seasonStr, String lang) {
        int year = Integer.parseInt(seasonStr);
        List<Race> races = raceDao.findByYearOrderByRoundAsc(year);

        if (races.isEmpty()) return new ChartDataDTO("No races for season " + year, "line", List.of(), List.of());

        Race finalRace = races.get(races.size() - 1);
        List<DriverStanding> finalStandings = driverStandingDao.findByRaceIdOrderByPositionAsc(finalRace.getRaceId());
        if (finalStandings.size() < 2) return new ChartDataDTO("Incomplete standings", "line", List.of(), List.of());

        Long id1 = finalStandings.get(0).getDriverId();
        Long id2 = finalStandings.get(1).getDriverId();

        Driver d1 = driverDao.findById(id1).orElse(null);
        Driver d2 = driverDao.findById(id2).orElse(null);
        if (d1 == null || d2 == null) return new ChartDataDTO("Driver not found", "line", List.of(), List.of());

        Map<Long, String> raceIdToName = races.stream().collect(Collectors.toMap(Race::getRaceId, Race::getName));
        Map<Long, Integer> roundOrder = races.stream().collect(Collectors.toMap(Race::getRaceId, Race::getRound));

        List<DriverStandingRaceView> points = driverStandingDao.getStandingsForTop2Drivers(year, id1, id2);

        Map<Long, Double> p1 = new HashMap<>();
        Map<Long, Double> p2 = new HashMap<>();
        for (DriverStandingRaceView row : points) {
            if (row.getDriverId().equals(id1)) p1.put(row.getRaceId(), row.getPoints());
            else if (row.getDriverId().equals(id2)) p2.put(row.getRaceId(), row.getPoints());
        }

        List<Long> orderedRaceIds = races.stream().map(Race::getRaceId).toList();
        List<String> labels = orderedRaceIds.stream().map(raceIdToName::get).toList();
        List<Double> series1 = orderedRaceIds.stream().map(id -> p1.getOrDefault(id, null)).toList();
        List<Double> series2 = orderedRaceIds.stream().map(id -> p2.getOrDefault(id, null)).toList();

        ChartSeriesDTO s1 = new ChartSeriesDTO(d1.getForename() + " " + d1.getSurname(), getDriverColor(id1), series1);
        ChartSeriesDTO s2 = new ChartSeriesDTO(d2.getForename() + " " + d2.getSurname(), getDriverColor(id2), series2);

        return new ChartDataDTO(
                chartI18n.get("championshipProgressTop2", lang) + seasonStr,
                "line",
                labels,
                List.of(s1, s2)
        );
    }










    private Long getBestQualiTimeMs(Qualifying q) {
        List<Long> times = new ArrayList<>();
        times.add(parseTimeToMilliseconds(q.getQ1()));
        times.add(parseTimeToMilliseconds(q.getQ2()));
        times.add(parseTimeToMilliseconds(q.getQ3()));
        return times.stream()
                .filter(Objects::nonNull)
                .min(Long::compareTo)
                .orElse(null);
    }

    private String getDriverColor(Long driverId) {
        // Paleta de colores amplia para pilotos
        String[] colors = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#3DC1D3",
                "#FFC312", "#C4E538", "#12CBC4", "#FDA7DF", "#ED4C67", "#F79F1F", "#A3CB38", "#1289A7",
                "#D980FA", "#B53471", "#EE5A24", "#009432", "#0652DD", "#9980FA", "#833471", "#006266"
        };
        // Asignar color determinista usando hash del driverId
        int index = Math.abs(driverId.hashCode()) % colors.length;
        return colors[index];
    }

    @Override
    public ChartDataDTO getFinishPositionDistribution(String lang) {
        List<FinishPositionCountView> data = resultDao.getFinishPositionHistogram();
        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d.getForename() + " " + d.getSurname()));

        Set<Integer> allPositions = data.stream().map(FinishPositionCountView::getPositionOrder).collect(Collectors.toSet());
        List<Integer> sortedPositions = new ArrayList<>(allPositions);
        Collections.sort(sortedPositions);
        List<String> labels = sortedPositions.stream().map(String::valueOf).toList();

        Map<Long, Map<Integer, Long>> counts = new HashMap<>();
        for (FinishPositionCountView row : data) {
            counts.computeIfAbsent(row.getDriverId(), k -> new HashMap<>())
                    .put(row.getPositionOrder(), row.getCount());
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> series = counts.entrySet().stream()
                .map(e -> {
                    String name = driverNames.getOrDefault(e.getKey(), "Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    List<Double> values = sortedPositions.stream()
                            .map(pos -> e.getValue().getOrDefault(pos, 0L).doubleValue())
                            .toList();
                    return new ChartSeriesDTO(name, color, values);
                }).toList();

        return new ChartDataDTO(chartI18n.get("finishPositionDistribution", lang), "bar", labels, series);
    }



    @Override
    public ChartDataDTO getFinishVsDNFRatio(String lang) {
        List<FinishDnfView> stats = resultDao.getAllDriverStatus();
        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d.getForename() + " " + d.getSurname()));

        Map<Long, int[]> counters = new HashMap<>(); // [0] = finishes, [1] = dnfs
        for (FinishDnfView row : stats) {
            Long driverId = row.getDriverId();
            String status = row.getStatus();
            boolean finished = status.contains("finished") || status.contains("classified");

            int[] arr = counters.computeIfAbsent(driverId, k -> new int[2]);
            if (finished) arr[0]++;
            else arr[1]++;
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> series = counters.entrySet().stream()
                .map(e -> {
                    String name = driverNames.getOrDefault(e.getKey(), "Driver " + e.getKey());
                    int[] val = e.getValue();
                    double total = val[0] + val[1];
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(
                            (100.0 * val[0]) / total,
                            (100.0 * val[1]) / total
                    ));
                }).toList();

        return new ChartDataDTO(chartI18n.get("finishVsDNFRatio", lang), "bar", List.of("Finished", "DNF"), series);
    }



    @Override
    public ChartDataDTO getSprintVsRacePointsEvolution(String driverIdStr, String lang) {
        Long driverId = Long.parseLong(driverIdStr);

        Map<Integer, Double> racePoints = new HashMap<>();
        Map<Integer, Double> sprintPoints = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (!r.getDriver().getDriverId().equals(driverId)) continue;
            int year = r.getRace().getYear();
            racePoints.merge(year, r.getPoints(), Double::sum);
        }

        for (SprintResult sr : sprintResultDao.findAll()) {
            if (!sr.getDriver().getDriverId().equals(driverId)) continue;
            int year = sr.getRace().getYear();
            sprintPoints.merge(year, sr.getPoints(), Double::sum);
        }

        Set<Integer> allYears = new TreeSet<>();
        allYears.addAll(racePoints.keySet());
        allYears.addAll(sprintPoints.keySet());

        List<String> labels = allYears.stream().map(String::valueOf).toList();
        List<Double> raceData = allYears.stream().map(y -> racePoints.getOrDefault(y, 0.0)).toList();
        List<Double> sprintData = allYears.stream().map(y -> sprintPoints.getOrDefault(y, 0.0)).toList();

        Driver d = driverDao.findById(driverId).orElse(null);
        String name = (d != null) ? d.getForename() + " " + d.getSurname() : "Driver " + driverId;

        return new ChartDataDTO(chartI18n.get("sprintVsRacePointsEvolution", lang) + name, "line", labels, List.of(
                new ChartSeriesDTO("Race Points", "#0088FE", raceData),
                new ChartSeriesDTO("Sprint Points", "#FFBB28", sprintData)
        ));
    }



    public ChartDataDTO getGridVsResultDeltaByConstructor(String lang) {
        List<ConstructorGridDeltaView> deltas = resultDao.getGridDeltasPerConstructor();

        Map<Long, List<Integer>> deltaMap = new HashMap<>();
        for (ConstructorGridDeltaView row : deltas) {
            deltaMap.computeIfAbsent(row.getConstructorId(), k -> new ArrayList<>()).add(row.getDelta());
        }

        Map<Long, String> constructorNames = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, Constructor::getName));

        AtomicInteger idx = new AtomicInteger();
        List<ChartSeriesDTO> dataset = deltaMap.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    String name = constructorNames.getOrDefault(e.getKey(), "Team " + e.getKey());
                    String color = getColorForIndex(idx.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(avg));
                }).toList();

        return new ChartDataDTO(
                chartI18n.get("gridToResultDeltaByConstructor", lang),
                "bar",
                List.of("Avg Δ (grid - finish)"),
                dataset
        );
    }


    public ChartDataDTO getReliabilityBySeason(String lang) {
        List<ConstructorReliabilityView> data = resultDao.getConstructorReliabilityStats();

        Set<String> nonFinishStatuses = Set.of(
                "accident", "collision", "collision damage", "engine", "gearbox", "hydraulics", "electrical",
                "suspension", "brakes", "fuel", "puncture", "tyre", "wheel", "steering", "transmission",
                "overheating", "driveshaft", "clutch", "chassis", "mechanical", "exhaust", "radiator",
                "oil leak", "oil pressure", "fire", "power unit", "power loss", "turbo", "water leak",
                "water pump", "brake duct", "electrics", "differential", "drivetrain"
        );

        Map<Long, Map<Integer, int[]>> stats = new HashMap<>();
        for (ConstructorReliabilityView row : data) {
            Long cid = row.getConstructorId();
            Integer year = row.getYear();
            String status = row.getStatus().toLowerCase();

            boolean dnf = nonFinishStatuses.stream().anyMatch(status::contains);

            stats.computeIfAbsent(cid, k -> new HashMap<>())
                    .computeIfAbsent(year, y -> new int[2]);

            int[] arr = stats.get(cid).get(year);
            arr[0]++;
            if (dnf) arr[1]++;
        }

        Set<Integer> allYears = stats.values().stream()
                .flatMap(map -> map.keySet().stream())
                .collect(Collectors.toCollection(TreeSet::new));

        List<String> labels = allYears.stream().map(String::valueOf).toList();

        Map<Long, String> constructorNames = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, Constructor::getName));

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, int[]>> entry : stats.entrySet()) {
            List<Double> values = new ArrayList<>();
            for (Integer year : allYears) {
                int[] arr = entry.getValue().getOrDefault(year, new int[]{0, 0});
                double ratio = (arr[0] == 0) ? Double.NaN : 100.0 * (arr[0] - arr[1]) / arr[0];
                values.add(ratio);
            }
            String name = constructorNames.getOrDefault(entry.getKey(), "Team " + entry.getKey());
            dataset.add(new ChartSeriesDTO(name, "#8884d8", values));
        }

        return new ChartDataDTO(chartI18n.get("reliabilityBySeason", lang), "line", labels, dataset);
    }


    public ChartDataDTO getAverageRaceDurationPerSeason(String lang) {
        List<RaceDurationView> durations = resultDao.getRaceDurations();

        Map<Integer, List<Long>> durationsByYear = new HashMap<>();
        for (RaceDurationView row : durations) {
            durationsByYear.computeIfAbsent(row.getYear(), k -> new ArrayList<>()).add(row.getMilliseconds());
        }

        List<Integer> years = new ArrayList<>(durationsByYear.keySet());
        Collections.sort(years);
        List<String> labels = years.stream().map(String::valueOf).toList();

        List<Double> values = years.stream()
                .map(y -> durationsByYear.get(y).stream().mapToLong(l -> l).average().orElse(0) / 60000.0)
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgRaceDurationPerSeason", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Duration (min)", "#8884d8", values))
        );
    }




    public ChartDataDTO getAvgFastestPitStopPerRace(String lang, String season) {
        List<FastestPitStopView> pitData = pitStopDao.getMinPitStopPerRace();
        Map<Long, Double> minPerRace = pitData.stream()
                .filter(p -> p.getMilliseconds() != null)
                .collect(Collectors.toMap(FastestPitStopView::getRaceId, p -> p.getMilliseconds().doubleValue()));

        List<Race> races = raceDao.findAllOrderByYearAndRound();

        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();

        for (Race r : races) {
            boolean matches = (season == null || String.valueOf(r.getYear()).equals(season));
            if (matches && minPerRace.containsKey(r.getRaceId())) {
                labels.add(r.getYear() + " - " + r.getName());
                values.add(minPerRace.get(r.getRaceId()));
            }
        }

        return new ChartDataDTO(chartI18n.get("avgFastestPitStopPerRace", lang), "bar", labels,
                List.of(new ChartSeriesDTO("Min Pit Stop (ms)", "#FFBB28", values)));
    }




    @Override
    public ChartDataDTO getRaceLeadersPerGrandPrix(String lang, String seasonStr) {
        Integer season = (seasonStr == null || seasonStr.isEmpty()) ? null : Integer.parseInt(seasonStr);

        // Obtener carreras por año o todas
        List<Race> races = (season == null)
                ? raceDao.findAllOrderByYearAndRound()
                : raceDao.findByYearOrderByRoundAsc(season);

        Set<Long> raceIds = races.stream().map(Race::getRaceId).collect(Collectors.toSet());

        // Obtener todos los laptimes con posición 1 en esas carreras
        List<LapTime> leaders = lapTimeDao.findByRaceIdInAndPositionOne(raceIds);

        // Agrupar por carrera los pilotos líderes
        Map<Long, Set<Long>> leadersPerRace = new HashMap<>();
        for (LapTime lt : leaders) {
            leadersPerRace
                    .computeIfAbsent(lt.getRaceId(), k -> new HashSet<>())
                    .add(lt.getDriverId());
        }

        // Crear gráfico
        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();

        for (Race r : races) {
            labels.add(r.getYear() + " - " + r.getName());
            values.add((double) leadersPerRace.getOrDefault(r.getRaceId(), Set.of()).size());
        }

        return new ChartDataDTO(
                chartI18n.get("raceLeadersCountPerGP", lang),
                "bar",
                labels,
                List.of(new ChartSeriesDTO("Distinct leaders", "#00C49F", values))
        );
    }





    @Override
    public ChartDataDTO getAvgQ1Q3DeltaBySeason(String lang) {
        List<Q1Q3DeltaView> times = qualifyingDao.getQ1Q3TimesSince2006();
        Map<Integer, List<Long>> deltas = new HashMap<>();

        for (Q1Q3DeltaView row : times) {
            Long t1 = parseTimeToMilliseconds(row.getQ1());
            Long t3 = parseTimeToMilliseconds(row.getQ3());
            if (t1 != null && t3 != null) {
                deltas.computeIfAbsent(row.getYear(), k -> new ArrayList<>()).add(t1 - t3);
            }
        }

        List<Integer> years = deltas.keySet().stream().sorted().toList();
        List<String> labels = years.stream().map(String::valueOf).toList();
        List<Double> values = years.stream()
                .map(y -> deltas.get(y).stream().mapToLong(l -> l).average().orElse(0))
                .toList();

        return new ChartDataDTO(chartI18n.get("avgQ1Q3DeltaPerSeason", lang), "line", labels,
                List.of(new ChartSeriesDTO("Q1 - Q3 (ms)", "#FF8042", values)));
    }


    @Override
    public ChartDataDTO getAvgQualiImprovement(String lang) {
        List<QualiProgressView> rows = qualifyingDao.getAllQualiTimesGroupedByDriver();
        Map<Long, List<Long>> q1Map = new HashMap<>();
        Map<Long, List<Long>> q2Map = new HashMap<>();
        Map<Long, List<Long>> q3Map = new HashMap<>();

        for (QualiProgressView row : rows) {
            Long driverId = row.getDriverId();
            if (driverId == null) continue;

            Long t1 = parseTimeToMilliseconds(row.getQ1());
            Long t2 = parseTimeToMilliseconds(row.getQ2());
            Long t3 = parseTimeToMilliseconds(row.getQ3());

            if (t1 != null) q1Map.computeIfAbsent(driverId, k -> new ArrayList<>()).add(t1);
            if (t2 != null) q2Map.computeIfAbsent(driverId, k -> new ArrayList<>()).add(t2);
            if (t3 != null) q3Map.computeIfAbsent(driverId, k -> new ArrayList<>()).add(t3);
        }


        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = q1Map.keySet().stream()
                .map(driverId -> {
                    String name = driverDao.findById(driverId).map(d -> d.getForename() + " " + d.getSurname())
                            .orElse("Driver " + driverId);
                    double q1 = q1Map.get(driverId).stream().mapToLong(l -> l).average().orElse(0);
                    double q2 = q2Map.getOrDefault(driverId, List.of()).stream().mapToLong(l -> l).average().orElse(0);
                    double q3 = q3Map.getOrDefault(driverId, List.of()).stream().mapToLong(l -> l).average().orElse(0);
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(q1, q2, q3));
                })
                .toList();

        return new ChartDataDTO(chartI18n.get("avgQualiImprovement", lang), "bar", List.of("Q1", "Q2", "Q3"), dataset);
    }



    @Override
    public ChartDataDTO getPointsStreaksPerDriver(String lang) {
        List<DriverRacePointsView> pointsList = resultDao.getAllDriverRacePointsOrdered();
        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d.getForename() + " " + d.getSurname()));

        Map<Long, List<Double>> pointsByDriver = new HashMap<>();
        for (DriverRacePointsView row : pointsList) {
            pointsByDriver.computeIfAbsent(row.getDriverId(), k -> new ArrayList<>())
                    .add(row.getPoints() != null ? row.getPoints() : 0.0);
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> series = pointsByDriver.entrySet().stream()
                .map(e -> {
                    int maxStreak = 0, current = 0;
                    for (Double pts : e.getValue()) {
                        if (pts > 0) current++;
                        else current = 0;
                        maxStreak = Math.max(maxStreak, current);
                    }
                    String name = driverNames.getOrDefault(e.getKey(), "Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of((double) maxStreak));
                }).toList();

        return new ChartDataDTO(chartI18n.get("pointsStreaksPerDriver", lang), "bar", List.of("Streak"), series);
    }




    @Override
    public ChartDataDTO getPerformanceInCrazyRaces(String lang) {
        Set<Long> wetRaceIds = resultDao.findAll().stream()
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()))
                .entrySet().stream()
                .filter(e -> {
                    long total = e.getValue().size();
                    long retirements = e.getValue().stream().filter(r -> {
                        String status = r.getStatus().getStatus().toLowerCase();
                        return status.contains("accident") || status.contains("collision") || status.contains("engine");
                    }).count();
                    return retirements > total * 0.4; // heurística lluvia
                }).map(Map.Entry::getKey).collect(Collectors.toSet());

        Map<Long, Integer> points = new HashMap<>();
        for (Result r : resultDao.findAll()) {
            if (wetRaceIds.contains(r.getRace().getRaceId())) {
                Long driverId = r.getDriver().getDriverId();
                points.merge(driverId, r.getPoints() != null ? r.getPoints().intValue() : 0, Integer::sum);
            }
        }

        List<ChartSeriesDTO> dataset = points.entrySet().stream()
                .map(e -> {
                    String name = driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + e.getKey());
                    return new ChartSeriesDTO(name, "#3399ff", List.of((double) e.getValue()));
                }).toList();

        return new ChartDataDTO(chartI18n.get("crazyRacePerformance", lang), "bar", List.of("Points in caotic races"), dataset);
    }

    @Override
    public ChartDataDTO getAvgFastestLapSpeedPerSeason(String lang) {
        List<FastestLapSpeedView> rows = resultDao.getFastestLapSpeedsPerSeason();

        Map<Integer, List<Double>> speeds = new HashMap<>();
        for (FastestLapSpeedView row : rows) {
            speeds.computeIfAbsent(row.getYear(), k -> new ArrayList<>()).add(row.getSpeed());
        }

        List<Integer> years = speeds.keySet().stream().sorted().toList();
        List<String> labels = years.stream().map(String::valueOf).toList();
        List<Double> values = years.stream()
                .map(y -> speeds.get(y).stream().mapToDouble(d -> d).average().orElse(0))
                .toList();

        return new ChartDataDTO(chartI18n.get("avgFastestLapSpeedPerSeason", lang), "line", labels,
                List.of(new ChartSeriesDTO("Avg km/h", "#00C49F", values)));
    }



    @Override
    public ChartDataDTO getTopOvertakingRaces(String lang) {
        ChartDataDTO base = getAvgOvertakesPerSeason(lang); // ya implementado
        List<String> labels = base.getLabels();
        List<Double> values = base.getDatasets().get(0).getData();

        List<Map.Entry<String, Double>> sorted = new ArrayList<>();
        for (int i = 0; i < labels.size(); i++) {
            sorted.add(Map.entry(labels.get(i), values.get(i)));
        }

        sorted.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        sorted = sorted.subList(0, Math.min(20, sorted.size()));

        List<String> topLabels = sorted.stream().map(Map.Entry::getKey).toList();
        List<Double> topValues = sorted.stream().map(Map.Entry::getValue).toList();

        return new ChartDataDTO(chartI18n.get("topOvertakingRaces", lang), "bar", topLabels,
                List.of(new ChartSeriesDTO("Overtakes", "#ff6f61", topValues)));
    }


    @Override
    public ChartDataDTO getAverageStartPositionByDriver(String decade, String lang) {
        int startYear = Integer.parseInt(decade.substring(0, 4));
        int endYear = startYear + 9;

        List<ResultGridView> rows = resultDao.getStartPositionsInYears(startYear, endYear);
        Map<Long, List<Integer>> starts = new HashMap<>();

        for (ResultGridView r : rows) {
            if (r.getGrid() == null || r.getGrid() <= 0) continue;
            starts.computeIfAbsent(r.getDriverId(), k -> new ArrayList<>()).add(r.getGrid());
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = starts.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    String name = driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(avg));
                }).toList();

        return new ChartDataDTO(chartI18n.get("avgStartPosition", lang) + " " + decade, "bar", List.of("Start Position"), dataset);
    }



    @Override
    public ChartDataDTO getAverageFinishPositionByDriver(String decade, String lang) {
        int startYear = Integer.parseInt(decade.substring(0, 4));
        int endYear = startYear + 9;

        List<ResultFinishView> rows = resultDao.getFinishPositionsInYears(startYear, endYear);
        Map<Long, List<Integer>> finishes = new HashMap<>();

        for (ResultFinishView r : rows) {
            if (r.getPositionOrder() == null || r.getPositionOrder() <= 0) continue;
            finishes.computeIfAbsent(r.getDriverId(), k -> new ArrayList<>()).add(r.getPositionOrder());
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = finishes.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    String name = driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(avg));
                }).toList();

        return new ChartDataDTO(chartI18n.get("avgFinishPosition", lang) + " " + decade, "bar", List.of("Finish Position"), dataset);
    }


    @Override
    public ChartDataDTO getDriverPerformanceTrajectory(String driverIdStr, String lang) {
        Long driverId = Long.parseLong(driverIdStr);

        // 1. Stats del piloto (ligero, optimizado)
        List<DriverRaceStatView> stats = resultDao.findDriverStatsOptimized(driverId);

        Map<Integer, List<Double>> positions = new HashMap<>();
        Map<Integer, Double> points = new HashMap<>();
        Map<Integer, Long> constructorPerYear = new HashMap<>();

        for (DriverRaceStatView stat : stats) {
            int year = stat.getYear();
            double pos = stat.getPositionOrder() != null ? stat.getPositionOrder() : 30.0;
            positions.computeIfAbsent(year, y -> new ArrayList<>()).add(pos);

            if (stat.getPoints() != null) {
                points.merge(year, stat.getPoints(), Double::sum);
            }

            constructorPerYear.putIfAbsent(year, stat.getConstructorId());
        }

        Set<Integer> years = new TreeSet<>(positions.keySet());
        List<String> labels = years.stream().map(String::valueOf).toList();

        // 2. Puntos por constructor y año (ya precalculado)
        Map<List<Object>, Double> constructorPointsByYear = resultDao.getConstructorPointsByYear().stream()
                .collect(Collectors.toMap(
                        p -> List.of(p.getYear(), p.getConstructorId()),
                        ConstructorPointsByYearView::getPoints
                ));

        // 3. Duelos con compañeros (lite version)
        Map<Long, List<RaceResultLiteView>> resultsByRace = resultDao.getAllRaceResultsLite().stream()
                .collect(Collectors.groupingBy(RaceResultLiteView::getRaceId));

        Map<Integer, int[]> teammateBattleStats = new HashMap<>();
        for (List<RaceResultLiteView> raceResults : resultsByRace.values()) {
            RaceResultLiteView main = raceResults.stream()
                    .filter(r -> r.getDriverId().equals(driverId))
                    .findFirst()
                    .orElse(null);

            if (main == null || main.getPositionOrder() == null) continue;

            Long constructorId = main.getConstructorId();
            int year = main.getYear();
            int pos = main.getPositionOrder();

            long wins = raceResults.stream()
                    .filter(r -> !r.getDriverId().equals(driverId))
                    .filter(r -> r.getConstructorId().equals(constructorId))
                    .filter(r -> r.getPositionOrder() != null)
                    .filter(r -> pos < r.getPositionOrder())
                    .count();

            long total = raceResults.stream()
                    .filter(r -> !r.getDriverId().equals(driverId))
                    .filter(r -> r.getConstructorId().equals(constructorId))
                    .filter(r -> r.getPositionOrder() != null)
                    .count();

            if (total > 0) {
                int[] arr = teammateBattleStats.computeIfAbsent(year, k -> new int[2]);
                arr[0] += (wins == total ? 1 : 0);
                arr[1]++;
            }
        }

        // 4. Posición final en el campeonato vs equipo
        Map<Integer, Race> lastRaceByYear = raceDao.findAllOrderByYearAndRound().stream()
                .collect(Collectors.toMap(Race::getYear, Function.identity(), (a, b) -> b));

        Map<Integer, Boolean> beatTeamInWdc = new HashMap<>();
        for (var entry : lastRaceByYear.entrySet()) {
            int year = entry.getKey();
            Long raceId = entry.getValue().getRaceId();

            List<DriverStanding> dsList = driverStandingDao.findByRaceIdOrderByPositionAsc(raceId);
            List<ConstructorStanding> csList = constructorStandingDao.findByRaceIdOrderByPositionAsc(raceId);

            Integer driverPos = dsList.stream()
                    .filter(d -> d.getDriverId().equals(driverId))
                    .map(DriverStanding::getPosition)
                    .findFirst().orElse(null);

            Long constructorId = constructorPerYear.get(year);
            if (constructorId == null) continue;

            Integer teamPos = csList.stream()
                    .filter(c -> c.getConstructorId().equals(constructorId))
                    .map(ConstructorStanding::getPosition)
                    .findFirst().orElse(null);

            if (driverPos != null && teamPos != null && driverPos <= teamPos + 1) {
                beatTeamInWdc.put(year, true);
            }
        }

        // 5. Cálculo del índice por año
        List<Double> values = years.stream()
                .map(year -> {
                    List<Double> yearPositions = positions.getOrDefault(year, List.of());
                    double avgPos = yearPositions.stream().mapToDouble(d -> d).average().orElse(25.0);
                    double stdDev = Math.sqrt(yearPositions.stream().mapToDouble(p -> Math.pow(p - avgPos, 2)).average().orElse(0));
                    double consistency = 1 / (1 + stdDev);

                    double rawPoints = points.getOrDefault(year, 0.0);
                    int raceCount = yearPositions.size();
                    int maxPoints = raceCount * getMaxPointsPerRace(year);
                    double normalizedPoints = maxPoints > 0 ? (rawPoints / maxPoints) * 100 : 0.0;

                    Long constructorId = constructorPerYear.get(year);
                    double teamPoints = constructorPointsByYear.getOrDefault(List.of(year, constructorId), 0.0);
                    double pilotShare = teamPoints > 0 ? rawPoints / teamPoints : 0.0;
                    double weight = pilotShare >= 0.69 ? 0.40 : pilotShare >= 0.65 ? 0.25 : 0.15;

                    double pointsScore = normalizedPoints * weight;

                    int[] battle = teammateBattleStats.getOrDefault(year, new int[]{0, 0});
                    double teammateScore = 0.0;
                    if (battle[1] >= 5) {
                        int wins = battle[0];
                        int losses = battle[1] - wins;
                        double winRatio = (double) wins / battle[1];
                        double diffFactor = Math.tanh((wins - losses) / 5.0);
                        teammateScore = winRatio * 10 + diffFactor * 10;
                    }

                    double consistencyScore = consistency * 100 * 0.60;
                    double bonus = beatTeamInWdc.getOrDefault(year, false) ? 20.0 : 0.0;

                    return pointsScore + consistencyScore + teammateScore + bonus;
                }).toList();

        String name = driverDao.findById(driverId)
                .map(d -> d.getForename() + " " + d.getSurname())
                .orElse("Driver " + driverId);

        return new ChartDataDTO(chartI18n.get("performanceTrajectory", lang) + " " + name,
                "line", labels,
                List.of(new ChartSeriesDTO("Performance Index (0-100)", getDriverColor(driverId), values)));
    }







    @Override
    public ChartDataDTO getConstructorPerformanceTrajectory(String constructorIdStr, String lang) {
        Long constructorId = Long.parseLong(constructorIdStr);
        String constructorRef = constructorDao.findById(constructorId)
                .map(Constructor::getConstructorRef)
                .orElse("constructor");

        List<ConstructorRaceStatView> stats = resultDao.findConstructorStatsOptimized(constructorId);

        Map<Integer, List<Integer>> positionsByYear = new HashMap<>();
        Map<Integer, Double> pointsByYear = new HashMap<>();

        for (ConstructorRaceStatView stat : stats) {
            int year = stat.getYear();
            if (stat.getPositionOrder() != null)
                positionsByYear.computeIfAbsent(year, k -> new ArrayList<>()).add(stat.getPositionOrder());
            if (stat.getPoints() != null)
                pointsByYear.merge(year, stat.getPoints(), Double::sum);
        }

        Set<Integer> years = new TreeSet<>(positionsByYear.keySet());
        List<String> labels = years.stream().map(String::valueOf).toList();

        // Última carrera por año solo si necesario
        Map<Integer, Race> lastRaceByYear = raceDao.findAllOrderByYearAndRound().stream()
                .collect(Collectors.toMap(Race::getYear, Function.identity(), (v1, v2) -> v2));

        Map<Integer, Integer> constructorsChampPos = new HashMap<>();
        for (Map.Entry<Integer, Race> entry : lastRaceByYear.entrySet()) {
            int year = entry.getKey();
            Long raceId = entry.getValue().getRaceId();

            constructorStandingDao.findByRaceIdOrderByPositionAsc(raceId).stream()
                    .filter(cs -> cs.getConstructorId().equals(constructorId))
                    .findFirst()
                    .map(ConstructorStanding::getPosition)
                    .ifPresent(pos -> constructorsChampPos.put(year, pos));
        }

        List<Double> values = years.stream()
                .map(y -> {
                    List<Integer> posList = positionsByYear.getOrDefault(y, List.of());
                    double avgPos = posList.stream().mapToInt(p -> p).average().orElse(20.0);
                    double stdDev = Math.sqrt(posList.stream().mapToDouble(p -> Math.pow(p - avgPos, 2)).average().orElse(0));
                    double consistency = 1 / (1 + stdDev);
                    double consistencyScore = consistency * 100 * 0.35;

                    double rawPoints = pointsByYear.getOrDefault(y, 0.0);
                    long raceCount = posList.size();
                    int maxPointsPerRace = getMaxPointsPerRace(y);
                    double maxPossiblePoints = raceCount * maxPointsPerRace;
                    double normalizedPoints = maxPossiblePoints > 0 ? (rawPoints / maxPossiblePoints) * 100 : 0;
                    double pointsScore = normalizedPoints * 0.45;

                    Integer champPos = constructorsChampPos.get(y);
                    double championshipBonus = champPos != null
                            ? (champPos == 1 ? 20.0 : (champPos <= 3 ? 10.0 : 0.0))
                            : 0.0;

                    return pointsScore + consistencyScore + championshipBonus;
                }).toList();

        String name = constructorDao.findById(constructorId)
                .map(Constructor::getName)
                .orElse("Constructor " + constructorId);

        return new ChartDataDTO(
                chartI18n.get("constructorPerformanceTrajectory", lang) + " " + name,
                "line",
                labels,
                List.of(new ChartSeriesDTO(
                        lang.equals("es")
                                ? "Índice de rendimiento del equipo (0–60)"
                                : "Team Performance Index (0–60)",
                        getTeamColor(constructorRef),
                        values
                ))
        );
    }








    @Override
    public ChartDataDTO getQualiToRacePositionDeltaHistogram(String lang) {
        List<QualiRaceDeltaView> deltas = resultDao.getAllGridRaceDeltas();

        Map<Integer, Integer> histogram = new TreeMap<>();
        for (QualiRaceDeltaView row : deltas) {
            if (row.getGrid() == null || row.getPositionOrder() == null) continue;
            int delta = row.getGrid() - row.getPositionOrder();
            if (Math.abs(delta) > 15) continue;
            histogram.merge(delta, 1, Integer::sum);
        }

        List<String> labels = histogram.keySet().stream().map(String::valueOf).toList();
        List<Double> values = histogram.values().stream().map(Integer::doubleValue).toList();

        return new ChartDataDTO(chartI18n.get("qualiToRaceDeltaHistogram", lang), "bar", labels,
                List.of(new ChartSeriesDTO("Drivers", "#0088FE", values)));
    }



    @Override
    public ChartDataDTO getQualiConsistencyScorePerDriver(String lang) {
        List<QualiPositionView> rows = qualifyingDao.getAllQualiPositions();

        Map<Long, List<Integer>> qualiPositions = new HashMap<>();
        for (QualiPositionView q : rows) {
            if (q.getPosition() != null) {
                qualiPositions.computeIfAbsent(q.getDriverId(), k -> new ArrayList<>()).add(q.getPosition());
            }
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = qualiPositions.entrySet().stream()
                .filter(e -> e.getValue().size() >= 5)
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    double variance = e.getValue().stream().mapToDouble(i -> Math.pow(i - avg, 2)).average().orElse(0.0);
                    double stdDev = Math.sqrt(variance);
                    String name = driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(stdDev));
                }).toList();

        return new ChartDataDTO(
                chartI18n.get("qualiConsistency", lang),
                "bar",
                List.of(lang.equals("es") ? "Desviación estándar" : "Standard deviation"),
                dataset
        );
    }




    @Override
    public ChartDataDTO getDriversWithMostPolesWithoutWin(String lang) {
        Set<Long> winners = resultDao.findAll().stream()
                .filter(r -> r.getPositionOrder() != null && r.getPositionOrder() == 1)
                .map(r -> r.getDriver().getDriverId()).collect(Collectors.toSet());

        Map<Long, Long> poleCounts = qualifyingDao.findAll().stream()
                .filter(q -> q.getPosition() != null && q.getPosition() == 1)
                .map(q -> q.getDriver().getDriverId())
                .filter(id -> !winners.contains(id))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        List<Map.Entry<Long, Long>> sorted = poleCounts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(15)
                .toList();

        List<String> labels = sorted.stream()
                .map(e -> driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname())
                        .orElse("Driver " + e.getKey())).toList();
        List<Double> values = sorted.stream().map(e -> (double) e.getValue()).toList();

        return new ChartDataDTO(chartI18n.get("polesWithoutWin", lang), "bar", labels,
                List.of(new ChartSeriesDTO("Poles", "#FF8042", values)));
    }



    @Override
    public ChartDataDTO getTechnicalFailuresPerConstructor(String lang) {
        Set<String> techFailures = Set.of(
                "accident", "collision", "collision damage", "engine", "gearbox", "hydraulics", "electrical",
                "suspension", "brakes", "fuel", "puncture", "tyre", "wheel", "steering", "transmission",
                "overheating", "driveshaft", "clutch", "chassis", "mechanical", "exhaust", "radiator",
                "oil leak", "oil pressure", "fire", "power unit", "power loss", "turbo", "water leak",
                "water pump", "brake duct", "electrics", "differential", "drivetrain"
        );

        Map<Long, Long> failureCounts = resultDao.findAll().stream()
                .filter(r -> r.getConstructor() != null && r.getStatus() != null && r.getStatus().getStatus() != null)
                .filter(r -> {
                    String s = r.getStatus().getStatus().toLowerCase();
                    return techFailures.contains(s);
                })
                .collect(Collectors.groupingBy(r -> r.getConstructor().getConstructorId(), Collectors.counting()));

        List<Map.Entry<Long, Long>> sorted = failureCounts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(25)
                .toList();

        List<String> labels = sorted.stream()
                .map(e -> constructorDao.findById(e.getKey()).map(Constructor::getName).orElse("Team " + e.getKey()))
                .toList();
        List<Double> values = sorted.stream().map(e -> (double) e.getValue()).toList();

        return new ChartDataDTO(
                chartI18n.get("technicalFailuresByTeam", lang),
                "bar",
                labels,
                List.of(new ChartSeriesDTO("Failures", "#A93226", values))
        );
    }



    @Override
    public ChartDataDTO getMostCommonRetirementCauseBySeason(String lang) {
        Set<String> validCauses = Set.of(
                "accident", "collision", "collision damage", "engine", "gearbox", "hydraulics", "electrical",
                "suspension", "brakes", "fuel", "puncture", "tyre", "wheel", "steering", "transmission",
                "overheating", "driveshaft", "clutch", "chassis", "mechanical", "exhaust", "radiator",
                "oil leak", "oil pressure", "fire", "power unit", "power loss", "turbo", "water leak",
                "water pump", "brake duct", "electrics", "differential", "drivetrain"
        );

        Map<Integer, Map<String, Long>> causeMap = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getStatus() == null || r.getStatus().getStatus() == null) continue;
            String status = r.getStatus().getStatus().toLowerCase();
            if (!validCauses.contains(status)) continue;

            int year = r.getRace().getYear();
            causeMap.computeIfAbsent(year, y -> new HashMap<>())
                    .merge(status, 1L, Long::sum);
        }

        // Calcular causas globales más frecuentes
        Map<String, Long> globalCounts = new HashMap<>();
        for (Map<String, Long> yearly : causeMap.values()) {
            for (Map.Entry<String, Long> entry : yearly.entrySet()) {
                globalCounts.merge(entry.getKey(), entry.getValue(), Long::sum);
            }
        }

        List<String> topCauses = globalCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(Map.Entry::getKey)
                .toList();

        List<Integer> years = new ArrayList<>(causeMap.keySet());
        Collections.sort(years);
        List<String> labels = years.stream().map(String::valueOf).toList();

        // Construir series de datos
        Map<String, List<Double>> causeSeries = new HashMap<>();
        for (String cause : topCauses) {
            List<Double> values = new ArrayList<>();
            for (Integer year : years) {
                values.add((double) causeMap.getOrDefault(year, Map.of()).getOrDefault(cause, 0L));
            }
            causeSeries.put(cause, values);
        }

        AtomicInteger idx = new AtomicInteger(0);
        List<ChartSeriesDTO> datasets = causeSeries.entrySet().stream()
                .map(e -> new ChartSeriesDTO(e.getKey(), getColorForIndex(idx.getAndIncrement()), e.getValue()))
                .toList();

        return new ChartDataDTO(
                chartI18n.get("retirementCausePerSeason", lang),
                "bar",
                labels,
                datasets
        );
    }



    @Override
    public ChartDataDTO getPerformanceWhenStartingOnPole(String lang) {
        Map<Long, int[]> stats = new HashMap<>(); // [0] = poles, [1] = wins from pole

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getPositionOrder() == null) continue;
            if (r.getGrid() != 1) continue;

            Long driverId = r.getDriver().getDriverId();
            stats.computeIfAbsent(driverId, k -> new int[2])[0]++; // pole
            if (r.getPositionOrder() == 1) {
                stats.get(driverId)[1]++; // win from pole
            }
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = stats.entrySet().stream()
                .filter(e -> e.getValue()[0] >= 5)
                .map(e -> {
                    String name = driverDao.findById(e.getKey())
                            .map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + e.getKey());
                    double ratio = (100.0 * e.getValue()[1]) / e.getValue()[0];
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(ratio));
                }).toList();

        return new ChartDataDTO(chartI18n.get("performanceFromPole", lang), "bar", List.of("% Wins from Pole"), dataset);
    }

    @Override
    public ChartDataDTO getPodiumsFromOutsideTop10Start(String lang) {
        Map<Long, Integer> counts = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getPositionOrder() == null) continue;
            if (r.getGrid() > 10 && r.getPositionOrder() <= 3) {
                Long driverId = r.getDriver().getDriverId();
                counts.merge(driverId, 1, Integer::sum);
            }
        }

        List<Map.Entry<Long, Integer>> top = counts.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue())
                .limit(15)
                .toList();

        List<String> labels = top.stream()
                .map(e -> driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname())
                        .orElse("Driver " + e.getKey()))
                .toList();
        List<Double> values = top.stream().map(e -> (double) e.getValue()).toList();

        return new ChartDataDTO(chartI18n.get("podiumsFromOutsideTop10", lang), "bar", labels,
                List.of(new ChartSeriesDTO("Podiums", "#00C49F", values)));
    }


    @Override
    public ChartDataDTO getBestDriversPerCircuit(String circuitRef, String lang) {
        List<Race> races = raceDao.findByCircuitRef(circuitRef);
        Set<Long> raceIds = races.stream().map(Race::getRaceId).collect(Collectors.toSet());

        Map<Long, Integer> wins = new HashMap<>();
        for (Result r : resultDao.findAll()) {
            if (!raceIds.contains(r.getRace().getRaceId())) continue;
            if (r.getPositionOrder() != null && r.getPositionOrder() == 1) {
                Long driverId = r.getDriver().getDriverId();
                wins.merge(driverId, 1, Integer::sum);
            }
        }

        List<Map.Entry<Long, Integer>> top = wins.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue())
                .limit(10).toList();

        List<String> labels = top.stream()
                .map(e -> driverDao.findById(e.getKey())
                        .map(d -> d.getForename() + " " + d.getSurname())
                        .orElse("Driver " + e.getKey())).toList();
        List<Double> values = top.stream().map(e -> (double) e.getValue()).toList();

        return new ChartDataDTO(chartI18n.get("bestDriversPerCircuit", lang) + " " + circuitRef, "bar", labels,
                List.of(new ChartSeriesDTO("Wins", "#1B9CFC", values)));
    }


    @Override
    public ChartDataDTO getConstructorDominanceByCircuit(String circuitRef, String lang) {
        List<Race> races = raceDao.findByCircuitRef(circuitRef);
        Set<Long> raceIds = races.stream().map(Race::getRaceId).collect(Collectors.toSet());

        Map<Long, Integer> teamWins = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (!raceIds.contains(r.getRace().getRaceId())) continue;
            if (r.getPositionOrder() != null && r.getPositionOrder() == 1 && r.getConstructor() != null) {
                Long constructorId = r.getConstructor().getConstructorId();
                teamWins.merge(constructorId, 1, Integer::sum);
            }
        }

        int total = teamWins.values().stream().mapToInt(Integer::intValue).sum(); // ← reemplazo

        List<Map.Entry<Long, Integer>> sorted = teamWins.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue())
                .toList();

        List<String> labels = sorted.stream()
                .map(e -> constructorDao.findById(e.getKey()).map(Constructor::getName).orElse("Team " + e.getKey()))
                .toList();
        List<Double> values = sorted.stream()
                .map(e -> (total == 0) ? 0.0 : 100.0 * e.getValue() / total)
                .toList();

        return new ChartDataDTO(
                chartI18n.get("constructorDominanceAtCircuit", lang) + " " + circuitRef,
                "bar",
                labels,
                List.of(new ChartSeriesDTO("% Wins", "#FFBB28", values))
        );
    }



    @Override
    public ChartDataDTO getMostImprovedDriversByDecade(String decade, String lang) {
        int startYear = Integer.parseInt(decade.substring(0, 4));
        int endYear = startYear + 9;

        // Map<raceId, year>
        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .filter(r -> r.getYear() >= startYear && r.getYear() <= endYear)
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        Set<Long> raceIdsInDecade = raceYearMap.keySet();

        // Filtrar standings solo de esas carreras
        List<DriverStanding> standings = driverStandingDao.findByRaceIdIn(raceIdsInDecade);

        // Map<driverId, Map<year, position>>
        Map<Long, Map<Integer, Integer>> positionsByDriver = new HashMap<>();

        for (DriverStanding ds : standings) {
            if (ds.getPosition() == null) continue;
            Integer year = raceYearMap.get(ds.getRaceId());
            if (year == null) continue;

            positionsByDriver
                    .computeIfAbsent(ds.getDriverId(), k -> new HashMap<>())
                    .put(year, ds.getPosition());
        }

        // Calcular mejora
        List<Map.Entry<Long, Double>> improvements = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Integer>> entry : positionsByDriver.entrySet()) {
            Map<Integer, Integer> yearPos = entry.getValue();
            if (yearPos.size() < 2) continue;

            int minYear = Collections.min(yearPos.keySet());
            int maxYear = Collections.max(yearPos.keySet());
            List<Integer> years = new ArrayList<>(yearPos.keySet());
            Collections.sort(years);

            List<Integer> earlyYears = years.stream().limit(3).toList();
            List<Integer> lateYears = years.stream().skip(Math.max(years.size() - 3, 0)).toList();

            double earlyAvg = earlyYears.stream().mapToInt(y -> yearPos.get(y)).average().orElse(0);
            double lateAvg = lateYears.stream().mapToInt(y -> yearPos.get(y)).average().orElse(0);

            double delta = earlyAvg - lateAvg;

            improvements.add(Map.entry(entry.getKey(), delta));
        }

        // Top 15 mejoras
        List<Map.Entry<Long, Double>> top = improvements.stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(15)
                .toList();


        // Pre-cargar nombres de pilotos
        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(
                        d -> d.getDriverId(),
                        d -> d.getForename() + " " + d.getSurname()
                ));

        List<String> labels = top.stream()
                .map(e -> driverNames.getOrDefault(e.getKey(), "Driver " + e.getKey()))
                .toList();

        List<Double> values = top.stream().map(e -> (double) e.getValue()).toList();

        return new ChartDataDTO(
                chartI18n.get("mostImprovedDriversByDecade", lang) + " " + decade,
                "bar",
                labels,
                List.of(new ChartSeriesDTO("Δ Position", "#12CBC4", values))
        );
    }



    @Override
    public ChartDataDTO getChampionshipsDecidedBeforeLastGP(String lang) {
        List<Race> allRaces = raceDao.findAllOrderByYearAndRound();

        // Agrupar carreras por año ya ordenadas por ronda
        Map<Integer, List<Race>> racesByYear = allRaces.stream()
                .collect(Collectors.groupingBy(Race::getYear, LinkedHashMap::new, Collectors.toList()));

        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();
        List<String> colors = new ArrayList<>();

        for (Map.Entry<Integer, List<Race>> entry : racesByYear.entrySet()) {
            int year = entry.getKey();
            List<Race> races = entry.getValue();

            if (races.size() < 2) continue;

            Race penultimateRace = races.get(races.size() - 2);
            Race lastRace = races.get(races.size() - 1);
            Long penultimateRaceId = penultimateRace.getRaceId();

            List<DriverStanding> standings = driverStandingDao.findByRaceIdOrderByPositionAsc(penultimateRaceId);
            if (standings.size() < 2) continue;

            double topPoints = standings.get(0).getPoints();
            double secondPoints = standings.get(1).getPoints();

            // Máximo de puntos posibles en la última carrera
            double maxPossiblePoints = getMaxPointsInSingleRace(year);

            boolean decided = (topPoints - secondPoints) > maxPossiblePoints;

            labels.add(String.valueOf(year));
            values.add(decided ? 1.0 : 0.0); // Todas las barras tienen altura 1
            colors.add(decided ? "#2ECC71" : "#E74C3C"); // Verde si decidido, rojo si no
        }

        ChartSeriesDTO series = new ChartSeriesDTO("Campeonato decidido", "#27AE60", values);
        series.setColors(colors); // Necesario que este método exista en ChartSeriesDTO

        return new ChartDataDTO(
                chartI18n.get("championshipsDecidedEarly", lang),
                "bar",
                labels,
                List.of(series)
        );
    }



    @Override
    public ChartDataDTO getTeammateWinsDelta(String driverIdStr, String lang) {
        Long targetDriverId;
        try {
            targetDriverId = Long.parseLong(driverIdStr);
        } catch (NumberFormatException e) {
            return new ChartDataDTO(chartI18n.get("invalidDriverId", lang), "bar", List.of(), List.of());
        }

        Map<String, Map<Long, Integer>> winsPerTeamSeason = new LinkedHashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getDriver() == null || r.getRace() == null)
                continue;

            int year = r.getRace().getYear();
            Long constructorId = r.getConstructor().getConstructorId();
            Long driverId = r.getDriver().getDriverId();

            String key = year + "-" + constructorId;
            winsPerTeamSeason.computeIfAbsent(key, k -> new HashMap<>());

            if (r.getPositionOrder() != null && r.getPositionOrder() == 1) {
                winsPerTeamSeason.get(key).merge(driverId, 1, Integer::sum);
            } else {
                winsPerTeamSeason.get(key).putIfAbsent(driverId, 0);
            }
        }

        List<String> labels = new ArrayList<>();
        List<Double> targetData = new ArrayList<>();
        List<Double> teammateData = new ArrayList<>();

        String targetName = driverDao.findById(targetDriverId)
                .map(d -> d.getForename() + " " + d.getSurname())
                .orElse("Driver " + driverIdStr);

        for (Map.Entry<String, Map<Long, Integer>> entry : winsPerTeamSeason.entrySet()) {
            String key = entry.getKey(); // Ej: "2006-9"
            String[] parts = key.split("-");
            int year = Integer.parseInt(parts[0]);

            Map<Long, Integer> driverMap = entry.getValue();
            if (driverMap.size() != 2 || !driverMap.containsKey(targetDriverId)) continue;

            List<Long> ids = new ArrayList<>(driverMap.keySet());
            Long teammateId = ids.get(0).equals(targetDriverId) ? ids.get(1) : ids.get(0);

            int targetWins = driverMap.getOrDefault(targetDriverId, 0);
            int teammateWins = driverMap.getOrDefault(teammateId, 0);

            String teammateName = driverDao.findById(teammateId)
                    .map(d -> d.getForename() + " " + d.getSurname())
                    .orElse("Teammate");

            // Etiqueta única por año y duelo
            String duelLabel = year + ": " + targetName + " vs " + teammateName;
            labels.add(duelLabel);

            targetData.add((double) targetWins);
            teammateData.add((double) teammateWins);
        }

        List<ChartSeriesDTO> seriesList = new ArrayList<>();
        seriesList.add(new ChartSeriesDTO(targetName, "#3498DB", targetData));
        seriesList.add(new ChartSeriesDTO(chartI18n.get("teammate", lang), "#E67E22", teammateData));

        return new ChartDataDTO(
                chartI18n.get("teammateWinsDelta", lang),
                "bar",
                labels,
                seriesList
        );
    }






    // Utilidad para inicializar una lista con N valores null
    private List<Double> initWithNulls(int size) {
        List<Double> list = new ArrayList<>(Collections.nCopies(size, null));
        return list;
    }





    @Override
    public ChartDataDTO getTeammatePodiumDelta(String lang) {
        Map<String, Map<Long, Integer>> teamPodiums = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getDriver() == null || r.getPositionOrder() == null) continue;
            int pos = r.getPositionOrder();
            if (pos > 3) continue;

            int year = r.getRace().getYear();
            String key = year + "-" + r.getConstructor().getConstructorId();
            Long driverId = r.getDriver().getDriverId();

            teamPodiums.computeIfAbsent(key, k -> new HashMap<>())
                    .merge(driverId, 1, Integer::sum);
        }

        List<ChartSeriesDTO> deltas = new ArrayList<>();
        AtomicInteger idx = new AtomicInteger(0);

        for (Map<Long, Integer> drivers : teamPodiums.values()) {
            if (drivers.size() == 2) {
                List<Map.Entry<Long, Integer>> list = new ArrayList<>(drivers.entrySet());
                list.sort(Map.Entry.comparingByValue(Comparator.reverseOrder()));

                long d1 = list.get(0).getKey();
                long d2 = list.get(1).getKey();
                int delta = list.get(0).getValue() - list.get(1).getValue();

                String name1 = driverDao.findById(d1).map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + d1);
                String name2 = driverDao.findById(d2).map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + d2);
                String label = name1 + " → " + name2 + " (+" + delta + ")";

                deltas.add(new ChartSeriesDTO(label, getColorForIndex(idx.getAndIncrement()), List.of((double) delta)));
            }
        }

        return new ChartDataDTO(chartI18n.get("teammatePodiumDelta", lang), "bar", List.of("Δ Podiums"), deltas);
    }

    @Override
    public ChartDataDTO getDriverEfficiencyRating(String lang) {
        Map<Long, List<Integer>> gridPositions = new HashMap<>();
        Map<Long, List<Double>> pointsPerRace = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getDriver() == null || r.getGrid() == null || r.getGrid() <= 0) continue;
            Long driverId = r.getDriver().getDriverId();

            gridPositions.computeIfAbsent(driverId, k -> new ArrayList<>()).add(r.getGrid());
            pointsPerRace.computeIfAbsent(driverId, k -> new ArrayList<>()).add(r.getPoints() != null ? r.getPoints() : 0.0);
        }

        Map<Long, Double> efficiencyByDriver = new HashMap<>();

        for (Long driverId : pointsPerRace.keySet()) {
            List<Double> points = pointsPerRace.get(driverId);
            List<Integer> grids = gridPositions.get(driverId);

            if (points.size() < 30 || grids == null || grids.size() != points.size()) continue;

            double avgPoints = points.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double avgGrid = grids.stream().mapToInt(Integer::intValue).average().orElse(1.0);

            if (avgGrid > 0) {
                double efficiency = avgPoints / avgGrid;
                efficiencyByDriver.put(driverId, efficiency);
            }
        }

        // Normalizar 0–100
        double max = efficiencyByDriver.values().stream().mapToDouble(Double::doubleValue).max().orElse(1);
        double min = efficiencyByDriver.values().stream().mapToDouble(Double::doubleValue).min().orElse(0);

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = efficiencyByDriver.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .map(e -> {
                    double norm = max != min ? (e.getValue() - min) / (max - min) * 100.0 : 100.0;
                    String name = driverDao.findById(e.getKey())
                            .map(d -> d.getForename() + " " + d.getSurname())
                            .orElse("Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(norm));
                })
                .toList();

        return new ChartDataDTO(
                chartI18n.get("driverEfficiencyRating", lang),
                "bar",
                List.of("Efficiency Score (normalized) = avg pts / avg grid"),
                dataset
        );
    }



    private double getMaxPointsInSingleRace(int year) {
        // Considerar casos especiales como sprint + victoria + vuelta rápida
        if ((year >= 2019) && (year <= 2024)) {
            return 25 + 1; // Victoria + vuelta rápida
        } else if(year >= 2010) {
            return 25;
        }else if (year >= 2003) {
            return 10; // Solo victoria, no había vuelta rápida
        } else if (year >= 1991) {
            return 10; // Igual, sistema antiguo
        } else if (year >= 1961){
            return 9; // Sistema anterior a 1991
        } else{
            return 8;
        }
    }




    private String getColorForIndex(int index) {
        String[] palette = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#25CCF7",
                "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2", "#218c74", "#40407a", "#ffb142", "#706fd3",
                "#ff5252", "#2C3A47", "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5",
                "#c56cf0", "#ff3838", "#70a1ff", "#2ed573", "#5352ed", "#ff6b81", "#1e90ff", "#ffeaa7"
        };
        return palette[index % palette.length];
    }


    private int getMaxPointsPerRace(int year) {
        if (year >= 2010) return 25;
        if (year >= 2003) return 10;
        if (year >= 1991) return 10;
        if (year >= 1960) return 9;
        return 8; // era antigua
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