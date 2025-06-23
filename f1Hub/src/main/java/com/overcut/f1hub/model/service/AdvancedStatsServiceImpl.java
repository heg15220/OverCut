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
                case "2030s": startYear = 2030; endYear = 2039; break;
                case "2040s": startYear = 2040; endYear = 2049; break;
                case "2050s": startYear = 2050; endYear = 2059; break;
                case "2060s": startYear = 2060; endYear = 2069; break;
            }
        }

        final int fromYear = startYear;
        final int toYear = endYear;

        List<Driver> allDrivers = driverDao.findAll();

        Map<Long, String> driverNames = allDrivers.stream()
                .collect(Collectors.toMap(
                        Driver::getDriverId,
                        d -> d.getForename() + " " + d.getSurname()
                ));

        List<Result> filteredResults = resultDao.findAll().stream()
                .filter(r -> r.getRace() != null && r.getDriver() != null && r.getConstructor() != null)
                .filter(r -> {
                    int year = r.getRace().getYear();
                    return year >= fromYear && year <= toYear;
                })
                .toList();

        // Map<driverId, Map<year, constructorRef>>
        Map<Long, Map<Integer, String>> driverYearTeamMap = new HashMap<>();
        for (Result r : filteredResults) {
            int year = r.getRace().getYear();
            Long driverId = r.getDriver().getDriverId();
            String constructorRef = r.getConstructor().getConstructorRef();

            driverYearTeamMap
                    .computeIfAbsent(driverId, k -> new HashMap<>())
                    .putIfAbsent(year, constructorRef);
        }

        // Filtrar solo podios
        List<Result> podiumResults = filteredResults.stream()
                .filter(r -> r.getPositionOrder() != null && r.getPositionOrder() <= 3)
                .toList();

        // Map<driverId, Map<year, count>>
        Map<Long, Map<Integer, Long>> podiumsByDriverYear = podiumResults.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getDriver().getDriverId(),
                        Collectors.groupingBy(
                                r -> r.getRace().getYear(),
                                Collectors.counting()
                        )
                ));

        // Map<constructorRef, Map<year, count>>
        Map<String, Map<Integer, Long>> podiumsByConstructorYear = podiumResults.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getConstructor().getConstructorRef(),
                        Collectors.groupingBy(
                                r -> r.getRace().getYear(),
                                Collectors.counting()
                        )
                ));

        // Extraer años en orden
        Set<Integer> allYears = filteredResults.stream()
                .map(r -> r.getRace().getYear())
                .collect(Collectors.toCollection(TreeSet::new));
        List<String> labels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> seriesList = new ArrayList<>();

        for (Driver d : allDrivers) {
            Long driverId = d.getDriverId();
            Map<Integer, String> yearTeamMap = driverYearTeamMap.getOrDefault(driverId, Map.of());
            List<Double> data = new ArrayList<>();
            long totalPodiums = 0;

            for (Integer year : allYears) {
                String constructorRef = yearTeamMap.get(year);
                if (constructorRef == null) {
                    data.add(null);
                    continue;
                }

                long driverPodiums = podiumsByDriverYear
                        .getOrDefault(driverId, Map.of())
                        .getOrDefault(year, 0L);

                long teamPodiums = podiumsByConstructorYear
                        .getOrDefault(constructorRef, Map.of())
                        .getOrDefault(year, 0L);

                if (driverPodiums > 0) totalPodiums += driverPodiums;

                double percentage = (teamPodiums == 0) ? 0.0 : (100.0 * driverPodiums) / teamPodiums;
                data.add(percentage);
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
        List<Result> allResults = resultDao.findAll().stream()
                .filter(r -> r.getRace() != null && r.getDriver() != null && r.getConstructor() != null)
                .toList();

        // Filtrar solo resultados con podio
        List<Result> podiumResults = allResults.stream()
                .filter(r -> r.getPositionOrder() != null && r.getPositionOrder() <= 3)
                .toList();

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

        // Map<driverId, Map<year, constructorRef>>
        Map<Long, Map<Integer, String>> driverYearTeamMap = new HashMap<>();
        for (Result r : allResults) {
            int year = r.getRace().getYear();
            Long dId = r.getDriver().getDriverId();
            String constructorRef = r.getConstructor().getConstructorRef();
            driverYearTeamMap
                    .computeIfAbsent(dId, k -> new HashMap<>())
                    .putIfAbsent(year, constructorRef);
        }

        // Map<driverId, Map<year, count>>
        Map<Long, Map<Integer, Long>> podiumsByDriverYear = podiumResults.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getDriver().getDriverId(),
                        Collectors.groupingBy(
                                r -> r.getRace().getYear(),
                                Collectors.counting()
                        )
                ));

        // Map<constructorRef, Map<year, count>>
        Map<String, Map<Integer, Long>> podiumsByConstructorYear = podiumResults.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getConstructor().getConstructorRef(),
                        Collectors.groupingBy(
                                r -> r.getRace().getYear(),
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

            Map<Integer, String> yearTeamMap = driverYearTeamMap.getOrDefault(driverId, Map.of());
            if (yearTeamMap.isEmpty()) continue;

            double totalDriverPodiums = 0;
            double totalTeamPodiums = 0;

            for (Map.Entry<Integer, String> e : yearTeamMap.entrySet()) {
                int year = e.getKey();
                String team = e.getValue();

                long driverPodiums = podiumsByDriverYear
                        .getOrDefault(driverId, Map.of())
                        .getOrDefault(year, 0L);

                long teamPodiums = podiumsByConstructorYear
                        .getOrDefault(team, Map.of())
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

        // Map<year, constructorRef>
        Map<Integer, String> yearToConstructorRef = qualifyingDao.findAll().stream()
                .filter(q -> q.getDriver().getDriverId().equals(driverId)
                        && q.getRace() != null
                        && q.getConstructor() != null)
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
        // 1. Identificamos los ID de status que representan accidentes o colisiones
        Set<Long> accidentStatusIds = statusDao.findAll().stream()
                .filter(s -> {
                    String status = s.getStatus().toLowerCase();
                    return status.contains("accident") || status.contains("collision");
                })
                .map(Status::getStatusId)
                .collect(Collectors.toSet());

        // 2. Mapeamos raceId → year
        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // 3. Map<Year, Número de carreras>
        Map<Integer, Integer> racesPerYear = new HashMap<>();

        // 4. Map<Year, Total de accidentes>
        Map<Integer, Integer> accidentsPerYear = new HashMap<>();

        // 5. Agrupar resultados por carrera
        Map<Long, List<Result>> resultsByRace = resultDao.findAll().stream()
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));

        // 6. Contamos accidentes por carrera y agregamos al año correspondiente
        for (Map.Entry<Long, List<Result>> entry : resultsByRace.entrySet()) {
            Long raceId = entry.getKey();
            List<Result> results = entry.getValue();

            Integer year = raceYearMap.get(raceId);
            if (year == null) continue;

            int accidentsInRace = (int) results.stream()
                    .filter(r -> accidentStatusIds.contains(r.getStatus().getStatusId()))
                    .count();

            accidentsPerYear.merge(year, accidentsInRace, Integer::sum);
            racesPerYear.merge(year, 1, Integer::sum);
        }

        // 7. Generar datos para la gráfica
        List<Integer> sortedYears = new ArrayList<>(racesPerYear.keySet());
        Collections.sort(sortedYears);

        List<String> labels = sortedYears.stream().map(String::valueOf).toList();
        List<Double> data = sortedYears.stream()
                .map(year -> {
                    int totalAccidents = accidentsPerYear.getOrDefault(year, 0);
                    int numRaces = racesPerYear.getOrDefault(year, 1); // evitar división por cero
                    return (double) totalAccidents / numRaces;
                })
                .toList();

        return new ChartDataDTO(chartI18n.get("avgAccidentsPerSeason", lang), "line", labels, List.of(
                new ChartSeriesDTO("Accidents per race", "#ff7300", data)
        ));
    }

    @Override
    public ChartDataDTO getAverageRetirementsBySeason(String lang) {
        // Lista de status que NO se consideran abandonos
        Set<String> excludedStatuses = Set.of(
                "finished", "classified", "not classified", "excluded", "disqualified",
                "did not qualify", "did not prequalify", "did not start", "withdrew",
                "107% rule"
        ).stream().map(String::toLowerCase).collect(Collectors.toSet());


        // Map<raceId, year>
        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Map<year, carreras>
        Map<Integer, Integer> raceCountPerYear = new HashMap<>();

        // Map<year, abandonos>
        Map<Integer, Integer> retirementsPerYear = new HashMap<>();

        // Agrupamos resultados por carrera
        Map<Long, List<Result>> resultsByRace = resultDao.findAll().stream()
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));

        for (Map.Entry<Long, List<Result>> entry : resultsByRace.entrySet()) {
            Long raceId = entry.getKey();
            List<Result> results = entry.getValue();

            Integer year = raceYearMap.get(raceId);
            if (year == null) continue;

            // Contar abandonos (status no incluido en los excluidos)
            int retirements = (int) results.stream()
                    .map(Result::getStatus)
                    .filter(Objects::nonNull)
                    .map(s -> s.getStatus().toLowerCase())
                    .filter(status ->
                            !excludedStatuses.contains(status) &&
                                    !status.matches("\\+\\d+\\s+laps?")
                    )
                    .count();



            // Sumamos abandonos y número de carreras
            retirementsPerYear.merge(year, retirements, Integer::sum);
            raceCountPerYear.merge(year, 1, Integer::sum);
        }

        List<Integer> sortedYears = new ArrayList<>(raceCountPerYear.keySet());
        Collections.sort(sortedYears);

        List<String> labels = sortedYears.stream().map(String::valueOf).toList();
        List<Double> data = sortedYears.stream()
                .map(year -> {
                    int totalRetirements = retirementsPerYear.getOrDefault(year, 0);
                    int totalRaces = raceCountPerYear.getOrDefault(year, 1);
                    return (double) totalRetirements / totalRaces;
                })
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgRetirementsPerSeason", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Retirements per race", "#cc0000", data))
        );
    }


    @Override
    public ChartDataDTO getAvgPositionsGainedFirstLaps(String lang) {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, List<Integer>> gains = new HashMap<>();

        Map<String, LapTime> lap2Map = lapTimeDao.findAll().stream()
                .filter(l -> l.getLap() == 2)
                .collect(Collectors.toMap(
                        l -> l.getRaceId() + "_" + l.getDriverId(),
                        l -> l,
                        (a, b) -> a
                ));

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getGrid() == 0) continue;

            String key = r.getRace().getRaceId() + "_" + r.getDriver().getDriverId();
            LapTime lap2 = lap2Map.get(key);
            if (lap2 == null || lap2.getPosition() == null) continue;

            int grid = r.getGrid();
            int posAfterLap2 = lap2.getPosition();
            int delta = grid - posAfterLap2;

            gains.computeIfAbsent(r.getDriver().getDriverId(), k -> new ArrayList<>()).add(delta);
        }

        // Paleta de colores
        String[] colorPalette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff",
                "#000000", "#ff7f00", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"
        };

        List<Long> driverIds = gains.keySet().stream().sorted().toList();
        Map<Long, String> colorMap = new HashMap<>();
        for (int i = 0; i < driverIds.size(); i++) {
            colorMap.put(driverIds.get(i), colorPalette[i % colorPalette.length]);
        }

        // Agrupar pilotos por valor Y (promedio redondeado)
        Map<Double, List<ChartSeriesDTO>> groupedByY = new HashMap<>();

        for (Map.Entry<Long, List<Integer>> entry : gains.entrySet()) {
            Long driverId = entry.getKey();
            List<Integer> list = entry.getValue();
            double avgGain = Math.round(list.stream().mapToDouble(i -> i).average().orElse(0.0) * 10.0) / 10.0;

            Driver d = driverMap.get(driverId);
            String label = d != null ? d.getForename() + " " + d.getSurname() : "Driver " + driverId;
            String abbr = d != null
                    ? d.getSurname().replaceAll("[^A-Za-z]", "").toUpperCase().substring(0, Math.min(3, d.getSurname().length()))
                    : "UNK";
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

        return new ChartDataDTO(chartI18n.get("avgPositionsGainedBySeason", lang) + label , "line", labels, List.of(series));
    }


    @Override
    public ChartDataDTO getQualiVsTeammateComparison(String driverIdStr, String lang) {
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
                chartI18n.get("raceComparisonVsTeammate", lang) + driverName,
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
        // 1. Obtener solo los resultados donde el piloto ganó desde P3 o peor
        List<Result> results = resultDao.findAllByPositionOrderAndGridGreaterThan(1, 2);

        // 2. Contar las victorias por piloto
        Map<Long, Integer> winCount = new HashMap<>();
        for (Result r : results) {
            Long driverId = r.getDriver().getDriverId();
            winCount.merge(driverId, 1, Integer::sum);
        }

        // 3. Obtener pilotos involucrados
        List<Driver> drivers = driverDao.findByDriverIds(winCount.keySet());

        // 4. Colores únicos por piloto (puedes usar tu propia lógica `getDriverColor()`)
        String[] colors = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#25CCF7",
                "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2", "#218c74", "#40407a", "#ffb142", "#706fd3",
                "#ff5252", "#2C3A47", "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5"
        };

        // 5. Construir el dataset
        List<ChartSeriesDTO> dataset = new ArrayList<>();
        int i = 0;
        for (Map.Entry<Long, Integer> entry : winCount.entrySet()) {
            Long driverId = entry.getKey();
            Driver driver = drivers.stream()
                    .filter(d -> d.getDriverId().equals(driverId))
                    .findFirst()
                    .orElse(null);

            String label = (driver != null)
                    ? driver.getForename() + " " + driver.getSurname()
                    : "Driver " + driverId;

            String color = colors[i % colors.length];
            dataset.add(new ChartSeriesDTO(label, color, List.of(entry.getValue().doubleValue())));
            i++;
        }

        // 6. Labels únicos (uno solo porque es tipo bar compacto)
        List<String> labels = List.of("Wins P3 or worse");

        return new ChartDataDTO(chartI18n.get("winsFromP3OrWorse", lang), "bar", labels, dataset);
    }


    @Override
    public ChartDataDTO getPodiumsFrom3rdOrWorse(String lang) {
        // 1. Obtener resultados donde el piloto hizo podio desde P3 o peor en la parrilla
        List<Result> results = resultDao.findAll().stream()
                .filter(r -> r.getPositionOrder() != null && r.getPositionOrder() <= 3
                        && r.getGrid() != null && r.getGrid() > 2)
                .toList();

        // 2. Contar los podios por piloto
        Map<Long, Integer> podiumCount = new HashMap<>();
        for (Result r : results) {
            Long driverId = r.getDriver().getDriverId();
            podiumCount.merge(driverId, 1, Integer::sum);
        }

        // 3. Obtener pilotos involucrados
        List<Driver> drivers = driverDao.findByDriverIds(podiumCount.keySet());

        // 4. Asignar colores únicos por piloto
        String[] colors = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1", "#F8EFBA", "#25CCF7",
                "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2", "#218c74", "#40407a", "#ffb142", "#706fd3",
                "#ff5252", "#2C3A47", "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5"
        };

        // 5. Construir el dataset
        List<ChartSeriesDTO> dataset = new ArrayList<>();
        int i = 0;
        for (Map.Entry<Long, Integer> entry : podiumCount.entrySet()) {
            Long driverId = entry.getKey();
            Driver driver = drivers.stream()
                    .filter(d -> d.getDriverId().equals(driverId))
                    .findFirst()
                    .orElse(null);

            String label = (driver != null)
                    ? driver.getForename() + " " + driver.getSurname()
                    : "Driver " + driverId;

            String color = colors[i % colors.length];
            dataset.add(new ChartSeriesDTO(label, color, List.of(entry.getValue().doubleValue())));
            i++;
        }

        // 6. Labels únicos (uno solo porque es tipo bar compacto)
        List<String> labels = List.of("Podiums P3 or worse");

        return new ChartDataDTO(chartI18n.get("podiumsFromP3OrWorse", lang), "bar", labels, dataset);
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

        // 🎨 Paleta de colores extensa
        String[] colorPalette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff",
                "#000000", "#ff7f00", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"
        };

        List<Long> driverIds = positionCounts.keySet().stream().sorted().toList();
        Map<Long, String> colorMap = new HashMap<>();
        for (int i = 0; i < driverIds.size(); i++) {
            colorMap.put(driverIds.get(i), colorPalette[i % colorPalette.length]);
        }

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Integer>> entry : positionCounts.entrySet()) {
            Long driverId = entry.getKey();
            Map<Integer, Integer> posMap = entry.getValue();

            Optional<Map.Entry<Integer, Integer>> mostCommon = posMap.entrySet().stream()
                    .max(Map.Entry.comparingByValue());

            if (mostCommon.isPresent()) {
                Driver driver = driverMap.get(driverId);
                String label = driver != null
                        ? driver.getForename() + " " + driver.getSurname()
                        : "Driver " + driverId;

                String abbr = driver != null
                        ? driver.getSurname().toUpperCase().substring(0, Math.min(3, driver.getSurname().length()))
                        : "UNK";

                String color = colorMap.getOrDefault(driverId, "#cccccc");

                ChartSeriesDTO dto = new ChartSeriesDTO(label, color, List.of((double) mostCommon.get().getKey()));
                dto.setAbbreviation(abbr); // ← asegúrate de tener este campo en el DTO
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
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        Map<Long, Race> racesById = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, r -> r));

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

        final int finalStartYear = startYear;
        final int finalEndYear = endYear;

        List<Race> finalRaces = raceDao.findAll().stream()
                .filter(r -> r.getYear() >= finalStartYear && r.getYear() <= finalEndYear)
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

        Map<Long, Map<Long, Integer>> constructorPosByRace = new HashMap<>();
        for (ConstructorStanding cs : constructorStandings) {
            constructorPosByRace
                    .computeIfAbsent(cs.getRaceId(), k -> new HashMap<>())
                    .put(cs.getConstructorId(), cs.getPosition());
        }

        // Map<raceId + driverId -> constructorId>
        Map<String, Long> driverConstructorByRace = resultDao.findAll().stream()
                .filter(r -> finalRaceIds.contains(r.getRace().getRaceId()))
                .collect(Collectors.toMap(
                        r -> r.getRace().getRaceId() + "_" + r.getDriver().getDriverId(),
                        r -> r.getConstructor().getConstructorId(),
                        (a, b) -> a // en caso de duplicado, mantener primero
                ));


        Map<Long, Integer> matches = new HashMap<>();
        for (DriverStanding ds : driverStandings) {
            Long driverId = ds.getDriverId();
            Long raceId = ds.getRaceId();
            Integer driverPos = ds.getPosition();

            String key = raceId + "_" + driverId;
            Long constructorId = driverConstructorByRace.get(key);
            if (constructorId == null) continue;

            Integer teamPos = constructorPosByRace.getOrDefault(raceId, Map.of())
                    .getOrDefault(constructorId, 99);

            if (driverPos <= teamPos) {
                matches.merge(driverId, 1, Integer::sum);
            }
        }


        // 🎨 Paleta extensa
        String[] colorPalette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff",
                "#000000", "#ff7f00", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"
        };

        List<Long> driverIds = matches.keySet().stream().sorted().toList();
        Map<Long, String> colorMap = new HashMap<>();
        for (int i = 0; i < driverIds.size(); i++) {
            colorMap.put(driverIds.get(i), colorPalette[i % colorPalette.length]);
        }

        List<ChartSeriesDTO> dataset = matches.entrySet().stream()
                .map(e -> {
                    String label = driverMap.containsKey(e.getKey())
                            ? driverMap.get(e.getKey()).getForename() + " " + driverMap.get(e.getKey()).getSurname()
                            : "Driver " + e.getKey();
                    String color = colorMap.getOrDefault(e.getKey(), "#cccccc");
                    return new ChartSeriesDTO(label, color, List.of((double) e.getValue()));
                }).toList();

        String title = chartI18n.get("driverVsTeamChampionshipFinish", lang)
                + (finalStartYear > 0 ? " (" + finalStartYear + "s)" : "");

        return new ChartDataDTO(title, "bar", List.of("Times"), dataset);
    }



    @Override
    public ChartDataDTO getWinsWithoutTop2(String lang) {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        Map<Long, Integer> winsMap = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getGrid() == null || r.getPositionOrder() == null) continue;
            if (r.getPositionOrder() == 1 && r.getGrid() > 2) {
                Long constructorId = r.getConstructor().getConstructorId();
                winsMap.merge(constructorId, 1, Integer::sum);
            }
        }

        String[] colorPalette = {
                "#E10600", "#1B9CFC", "#F97F51", "#B33771", "#3B3B98", "#55E6C1",
                "#F8EFBA", "#25CCF7", "#FD7272", "#9AECDB", "#D6A2E8", "#33d9b2",
                "#218c74", "#40407a", "#ffb142", "#706fd3", "#ff5252", "#2C3A47",
                "#34ace0", "#ffb8b8", "#3ae374", "#ffa801", "#cd84f1", "#7efff5",
                "#c56cf0", "#ff3838", "#70a1ff", "#2ed573", "#5352ed", "#ff6b81",
                "#1e90ff", "#ffeaa7", "#2f3542", "#1abc9c", "#9b59b6", "#f39c12"
        };

        List<Map.Entry<Long, Integer>> sortedEntries = new ArrayList<>(winsMap.entrySet());
        sortedEntries.sort(Map.Entry.<Long, Integer>comparingByValue().reversed());

        List<ChartSeriesDTO> dataset = new ArrayList<>();
        for (int i = 0; i < sortedEntries.size(); i++) {
            Long constructorId = sortedEntries.get(i).getKey();
            Integer wins = sortedEntries.get(i).getValue();
            String label = constructorMap.getOrDefault(constructorId, new Constructor()).getName();
            String color = colorPalette[i % colorPalette.length];
            dataset.add(new ChartSeriesDTO(label, color, List.of((double) wins)));
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

        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        Map<Long, Map<Integer, List<Integer>>> data = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getPositionOrder() == null || r.getConstructor() == null) continue;

            Integer year = raceYearMap.get(r.getRace().getRaceId());
            if (year == null || year < startYear || year > endYear) continue;

            int delta = r.getGrid() - r.getPositionOrder();
            Long constructorId = r.getConstructor().getConstructorId();

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
                if (deltas.isEmpty()) {
                    values.add(null); // o Double.NaN
                } else {
                    double avg = deltas.stream().mapToInt(i -> i).average().orElse(0.0);
                    values.add(avg);
                }

            }
            datasets.add(new ChartSeriesDTO(label, "#8884d8", values));
        }

        return new ChartDataDTO(chartI18n.get("teamComebacksBySeason", lang), "line", labels, datasets);
    }



    @Override
    public ChartDataDTO getMostTeamPoints(String lang) {
        Map<Long, Constructor> constructorMap = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, c -> c));

        // Map<constructorId, totalPoints>
        Map<Long, Double> totalPoints = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getPoints() == null) continue;
            Long constructorId = r.getConstructor().getConstructorId();
            totalPoints.merge(constructorId, r.getPoints(), Double::sum);
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = totalPoints.entrySet().stream()
                .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue())) // opcional: ordenar de mayor a menor
                .map(e -> {
                    Constructor constructor = constructorMap.get(e.getKey());
                    String label = constructor != null ? constructor.getName() : "Unknown";
                    String color = getColorForIndex(index.getAndIncrement()); // función que genera color por índice
                    return new ChartSeriesDTO(label, color, List.of(e.getValue()));
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

        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Map<constructorId, Map<year, totalPoints>>
        Map<Long, Map<Integer, Double>> data = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getPoints() == null) continue;
            Integer year = raceYearMap.get(r.getRace().getRaceId());
            if (year == null || year < startYear || year > endYear) continue;

            Long constructorId = r.getConstructor().getConstructorId();

            data.computeIfAbsent(constructorId, k -> new HashMap<>())
                    .merge(year, r.getPoints(), Double::sum);
        }

        // Generar etiquetas (años presentes en la década)
        Set<Integer> allYears = new TreeSet<>();
        data.values().forEach(map -> allYears.addAll(map.keySet()));
        List<String> labels = allYears.stream().map(String::valueOf).toList();

        // Construir datasets
        List<ChartSeriesDTO> datasets = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Double>> entry : data.entrySet()) {
            Long constructorId = entry.getKey();
            String label = constructorMap.getOrDefault(constructorId, new Constructor()).getName();
            List<Double> values = new ArrayList<>();
            for (Integer year : allYears) {
                if (entry.getValue().containsKey(year)) {
                    values.add(entry.getValue().get(year));
                } else {
                    values.add(null); // evitar línea falsa
                }
            }
            datasets.add(new ChartSeriesDTO(label, "#82ca9d", values));
        }

        return new ChartDataDTO(chartI18n.get("avgPointsByTeamPerSeason", lang), "line", labels, datasets);
    }



    @Override
    public ChartDataDTO getPitStopsPerRace(String yearStr, String lang) {
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
        return new ChartDataDTO(chartI18n.get("pitStopsPerRace", lang) + (" + year + "), "bar", labels,
                List.of(new ChartSeriesDTO("Times on pit lane", "#ff8042", values)));
    }


    @Override
    public ChartDataDTO getAvgPitStopsPerSeason(String lang) {
        // Mapa: raceId → year
        Map<Long, Integer> raceYears = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Conteo de carreras por año
        Map<Integer, Set<Long>> yearToRaceIds = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : raceYears.entrySet()) {
            yearToRaceIds.computeIfAbsent(entry.getValue(), k -> new HashSet<>()).add(entry.getKey());
        }

        // Conteo de pit stops por año
        Map<Integer, Integer> yearPits = new HashMap<>();
        for (PitStop p : pitStopDao.findAll()) {
            Integer year = raceYears.get(p.getRaceId());
            if (year != null) {
                yearPits.merge(year, 1, Integer::sum);
            }
        }

        // Construcción de gráfico
        List<Integer> years = yearPits.keySet().stream().sorted().toList();
        List<String> labels = years.stream().map(String::valueOf).toList();
        List<Double> values = years.stream()
                .map(y -> {
                    int pits = yearPits.getOrDefault(y, 0);
                    int races = yearToRaceIds.getOrDefault(y, Set.of()).size();
                    return races == 0 ? 0.0 : (double) pits / races;
                })
                .toList();

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
        List<LapTime> lapTimes = lapTimeDao.findByRaceIdIn(raceMap.keySet());

        // Recorremos todos los tiempos de vuelta
        for (LapTime lapTime : lapTimes) {
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
                double teamTotalPoints = teamResults.stream()
                        .mapToDouble(Result::getPoints)
                        .sum();

                // ✅ Filtrar equipos sin puntos en esta carrera
                if (teamTotalPoints == 0.0) continue;

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
        int colorIndex = 0;

        for (Map.Entry<Long, List<Double>> entry : deltas.entrySet()) {
            Long driverId = entry.getKey();
            List<Double> deltaList = entry.getValue();
            double avgDelta = deltaList.stream().mapToDouble(d -> d).average().orElse(0.0);

            String label = driverMap.containsKey(driverId)
                    ? driverMap.get(driverId).getForename() + " " + driverMap.get(driverId).getSurname()
                    : "Driver " + driverId;

            String color = colorPalette[colorIndex % colorPalette.length];
            colorIndex++;

            seriesList.add(new ChartSeriesDTO(label, color, List.of(avgDelta)));
        }


        return new ChartDataDTO(
                chartI18n.get("pointsDeltaVsTeammate",lang) + season ,
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
        // Agrupamos las qualis por carrera
        Map<Long, List<Qualifying>> qualiByRace = qualifyingDao.findAll().stream()
                .filter(q -> q.getPosition() != null)
                .collect(Collectors.groupingBy(q -> q.getRace().getRaceId()));

        // Map<year, List<diferencias entre P2 y P1>
        Map<Integer, List<Long>> yearToDifferences = new HashMap<>();

        for (Map.Entry<Long, List<Qualifying>> entry : qualiByRace.entrySet()) {
            List<Qualifying> qList = entry.getValue();

            // Buscar P1 y P2
            Optional<Qualifying> poleOpt = qList.stream().filter(q -> q.getPosition() == 1).findFirst();
            Optional<Qualifying> secondOpt = qList.stream().filter(q -> q.getPosition() == 2).findFirst();

            if (poleOpt.isEmpty() || secondOpt.isEmpty()) continue;

            Qualifying pole = poleOpt.get();
            Qualifying second = secondOpt.get();

            Long poleTime = getBestQualiTimeMs(pole);
            Long secondTime = getBestQualiTimeMs(second);

            if (poleTime == null || secondTime == null) continue;

            long diff = secondTime - poleTime;
            if (diff < 0) continue; // Datos inválidos

            int year = pole.getRace().getYear();
            yearToDifferences.computeIfAbsent(year, y -> new ArrayList<>()).add(diff);
        }

        List<Integer> sortedYears = new ArrayList<>(yearToDifferences.keySet());
        Collections.sort(sortedYears);

        List<String> labels = sortedYears.stream().map(String::valueOf).toList();
        List<Double> data = sortedYears.stream()
                .map(year -> {
                    List<Long> diffs = yearToDifferences.get(year);
                    return diffs.stream().mapToLong(Long::longValue).average().orElse(0);
                })
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgQualiGapP1P2", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap in ms", "#00C49F", data))
        );
    }


    @Override
    public ChartDataDTO getAverageQualiGapBetween10thAndPolePerSeason(String lang) {
        // Agrupar por carrera
        Map<Long, List<Qualifying>> qualiByRace = qualifyingDao.findAll().stream()
                .filter(q -> q.getPosition() != null)
                .collect(Collectors.groupingBy(q -> q.getRace().getRaceId()));

        // Map<year, List<diferencias entre P10 y P1>
        Map<Integer, List<Long>> yearToDifferences = new HashMap<>();

        for (Map.Entry<Long, List<Qualifying>> entry : qualiByRace.entrySet()) {
            List<Qualifying> qList = entry.getValue();

            Optional<Qualifying> poleOpt = qList.stream().filter(q -> q.getPosition() == 1).findFirst();
            Optional<Qualifying> tenthOpt = qList.stream().filter(q -> q.getPosition() == 10).findFirst();

            if (poleOpt.isEmpty() || tenthOpt.isEmpty()) continue;

            Qualifying pole = poleOpt.get();
            Qualifying tenth = tenthOpt.get();

            Long poleTime = getBestQualiTimeMs(pole);
            Long tenthTime = getBestQualiTimeMs(tenth);

            if (poleTime == null || tenthTime == null) continue;

            long diff = tenthTime - poleTime;
            if (diff < 0) continue;

            int year = pole.getRace().getYear();
            yearToDifferences.computeIfAbsent(year, y -> new ArrayList<>()).add(diff);
        }

        List<Integer> sortedYears = new ArrayList<>(yearToDifferences.keySet());
        Collections.sort(sortedYears);

        List<String> labels = sortedYears.stream().map(String::valueOf).toList();
        List<Double> data = sortedYears.stream()
                .map(year -> {
                    List<Long> diffs = yearToDifferences.get(year);
                    return diffs.stream().mapToLong(Long::longValue).average().orElse(0);
                })
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgQualiGapP10Pole",lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap in ms", "#FFBB28", data))
        );
    }


    @Override
    public ChartDataDTO getAverageRaceGapBetween1stAnd2ndPerSeason(String lang) {
        // Map<raceId, year>
        Map<Long, Integer> raceYearMap = raceDao.findAll().stream()
                .collect(Collectors.toMap(Race::getRaceId, Race::getYear));

        // Agrupar resultados por carrera
        Map<Long, List<Result>> resultsByRace = resultDao.findAll().stream()
                .filter(r -> r.getPositionOrder() == 1 || r.getPositionOrder() == 2)
                .filter(r -> r.getMilliseconds() != null)
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));

        // Map<year, List<diferencias entre P2 y P1>
        Map<Integer, List<Long>> yearToDifferences = new HashMap<>();

        for (Map.Entry<Long, List<Result>> entry : resultsByRace.entrySet()) {
            Long raceId = entry.getKey();
            List<Result> raceResults = entry.getValue();

            Integer year = raceYearMap.get(raceId);
            if (year == null) continue;

            Optional<Result> p1 = raceResults.stream()
                    .filter(r -> r.getPositionOrder() == 1)
                    .findFirst();
            Optional<Result> p2 = raceResults.stream()
                    .filter(r -> r.getPositionOrder() == 2)
                    .findFirst();

            if (p1.isEmpty() || p2.isEmpty()) continue;

            long time1 = p1.get().getMilliseconds();
            long time2 = p2.get().getMilliseconds();

            long diff = time2 - time1;
            if (diff < 0) continue;

            yearToDifferences.computeIfAbsent(year, y -> new ArrayList<>()).add(diff);
        }

        List<Integer> sortedYears = new ArrayList<>(yearToDifferences.keySet());
        Collections.sort(sortedYears);

        List<String> labels = sortedYears.stream().map(String::valueOf).toList();
        List<Double> data = sortedYears.stream()
                .map(year -> {
                    List<Long> diffs = yearToDifferences.get(year);
                    return diffs.stream().mapToLong(Long::longValue).average().orElse(0);
                })
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgRaceGapP1P2", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap in ms", "#FF4444", data))
        );
    }

    @Override
    public ChartDataDTO getDistinctGridPositionsFromWhichDriverWon(String lang) {
        Map<Long, Driver> driverMap = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d));

        // Map<gridPos, Set<driverId>>
        Map<Integer, Set<Long>> winnersByGridPos = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getPositionOrder() != null && r.getPositionOrder() == 1 &&
                    r.getGrid() != null && r.getDriver() != null) {
                int grid = r.getGrid();
                long driverId = r.getDriver().getDriverId();
                winnersByGridPos.computeIfAbsent(grid, k -> new HashSet<>()).add(driverId);
            }
        }

        // Obtener todos los pilotos involucrados y asignar colores únicos
        Set<Long> allDrivers = winnersByGridPos.values().stream()
                .flatMap(Set::stream)
                .collect(Collectors.toSet());

        List<Long> sortedDriverIds = allDrivers.stream()
                .sorted(Comparator.comparing(id -> {
                    Driver d = driverMap.get(id);
                    return d.getForename() + " " + d.getSurname();
                }))
                .toList();

        String[] palette = {
                "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0",
                "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8",
                "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080"
        };

        Map<Long, String> driverColors = new HashMap<>();
        for (int i = 0; i < sortedDriverIds.size(); i++) {
            driverColors.put(sortedDriverIds.get(i), palette[i % palette.length]);
        }

        // Labels para eje Y → posiciones de parrilla ordenadas de menor a mayor
        List<Integer> gridPositions = winnersByGridPos.keySet().stream()
                .sorted()
                .toList();

        List<String> labels = gridPositions.stream()
                .map(Object::toString)
                .toList();

        List<ChartSeriesDTO> dataset = new ArrayList<>();

        for (Integer grid : gridPositions) {
            List<Long> drivers = winnersByGridPos.get(grid).stream()
                    .sorted(Comparator.comparing(id -> {
                        Driver d = driverMap.get(id);
                        return d.getForename() + " " + d.getSurname();
                    }))
                    .toList();

            int n = drivers.size();
            for (int i = 0; i < n; i++) {
                Long driverId = drivers.get(i);
                double xOffset = i - (n - 1) / 2.0;  // desplazamiento horizontal
                double y = grid;

                Driver d = driverMap.get(driverId);
                String name = d.getForename() + " " + d.getSurname();
                String color = driverColors.get(driverId);
                String abbr = d.getSurname().replaceAll("[^A-Za-z]", "")
                        .toUpperCase().substring(0, Math.min(3, d.getSurname().length()));

                ChartSeriesDTO dto = new ChartSeriesDTO(name, color, List.of(xOffset, y));
                dto.setAbbreviation(abbr);
                dataset.add(dto);
            }
        }

        ChartDataDTO chart = new ChartDataDTO();
        chart.setTitle(chartI18n.get("gridPositionsFromWhichDriversWon", lang));
        chart.setChartType("scatter");
        chart.setLabels(labels); // eje Y → posiciones de parrilla
        chart.setDatasets(dataset);
        return chart;
    }


    @Override
    public ChartDataDTO getFrontRowVictoryRatePerSeason(String lang) {
        // Map<year, totalCarreras>
        Map<Integer, Long> totalRacesPerYear = raceDao.findAll().stream()
                .collect(Collectors.groupingBy(Race::getYear, Collectors.counting()));

        // Map<year, victorias desde 1ª fila>
        Map<Integer, Long> frontRowWinsPerYear = resultDao.findAll().stream()
                .filter(r -> r.getGrid() != null && (r.getGrid() == 1 || r.getGrid() == 2))
                .filter(r -> r.getPositionOrder() != null && r.getPositionOrder() == 1)
                .filter(r -> r.getRace() != null)
                .collect(Collectors.groupingBy(r -> r.getRace().getYear(), Collectors.counting()));

        // Crear datos para la gráfica
        List<Integer> years = totalRacesPerYear.keySet().stream()
                .sorted()
                .toList();

        List<Double> ratios = years.stream()
                .map(year -> {
                    long totalRaces = totalRacesPerYear.getOrDefault(year, 0L);
                    long frontRowWins = frontRowWinsPerYear.getOrDefault(year, 0L);
                    return totalRaces == 0 ? 0.0 : (double) frontRowWins / totalRaces;
                })
                .toList();

        ChartSeriesDTO series = new ChartSeriesDTO("Wins from front row", "#2ecc71", ratios);

        return new ChartDataDTO(
                chartI18n.get("frontRowVictoryRate", lang),
                "line",
                years.stream().map(String::valueOf).toList(),
                List.of(series)
        );
    }


    @Override
    public ChartDataDTO getWinPercentageByDriverAtCircuit(String circuitRef, String lang) {
        // 1. Obtener todos los circuitos que coincidan con el circuitRef
        List<Circuit> circuits = circuitDao.findAll().stream()
                .filter(c -> c.getCircuitRef().equalsIgnoreCase(circuitRef))
                .toList();

        Set<Long> circuitIds = circuits.stream()
                .map(Circuit::getCircuitId)
                .collect(Collectors.toSet());

        // 2. Obtener carreras en esos circuitos
        Set<Long> raceIds = raceDao.findAll().stream()
                .filter(r -> circuitIds.contains(r.getCircuit().getCircuitId()))
                .map(Race::getRaceId)
                .collect(Collectors.toSet());

        // 3. Filtrar resultados de victorias en esos circuitos
        Map<Long, Long> winCountByDriver = resultDao.findAll().stream()
                .filter(r -> raceIds.contains(r.getRace().getRaceId()))
                .filter(r -> r.getPositionOrder() != null && r.getPositionOrder() == 1)
                .collect(Collectors.groupingBy(
                        r -> r.getDriver().getDriverId(),
                        Collectors.counting()
                ));

        long totalWins = winCountByDriver.values().stream().mapToLong(Long::longValue).sum();

        // 4. Preparar listas para el gráfico pie
        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();
        List<String> colors = new ArrayList<>();

        for (Map.Entry<Long, Long> entry : winCountByDriver.entrySet()) {
            if (entry.getValue() == 0) continue;

            Driver d = driverDao.findById(entry.getKey()).orElse(null);
            String name = (d != null) ? d.getForename() + " " + d.getSurname() : "Desconocido";
            double percentage = (entry.getValue() * 100.0) / totalWins;

            labels.add(name);
            values.add(percentage);
            colors.add(getDriverColor(entry.getKey()));
        }

        // 5. Crear una sola serie para el gráfico pie
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
        // 1. Obtener circuitos que coincidan con el circuitRef
        Set<Long> circuitIds = circuitDao.findAll().stream()
                .filter(c -> c.getCircuitRef().equalsIgnoreCase(circuitRef))
                .map(Circuit::getCircuitId)
                .collect(Collectors.toSet());

        if (circuitIds.isEmpty()) {
            return new ChartDataDTO("Circuito no encontrado", "bar", List.of(), List.of());
        }

        // 2. Obtener carreras en esos circuitos
        Set<Long> raceIds = raceDao.findAll().stream()
                .filter(r -> circuitIds.contains(r.getCircuit().getCircuitId()))
                .map(Race::getRaceId)
                .collect(Collectors.toSet());

        if (raceIds.isEmpty()) {
            return new ChartDataDTO("Sin carreras para " + circuitRef, "bar", List.of(), List.of());
        }

        // 3. Filtrar todos los resultados solo una vez
        Map<Long, List<Result>> resultsByRace = resultDao.findAll().stream()
                .filter(r -> r.getRace() != null && raceIds.contains(r.getRace().getRaceId()))
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));

        int winsFromPole = 0;
        int winsNotFromPole = 0;

        // 4. Procesar los ganadores de cada carrera
        for (Long raceId : raceIds) {
            List<Result> results = resultsByRace.get(raceId);
            if (results == null) continue;

            Optional<Result> winnerOpt = results.stream()
                    .filter(r -> r.getPositionOrder() != null && r.getPositionOrder() == 1)
                    .findFirst();

            if (winnerOpt.isPresent()) {
                Integer grid = winnerOpt.get().getGrid();
                if (grid != null && grid == 1) {
                    winsFromPole++;
                } else {
                    winsNotFromPole++;
                }
            }
        }

        // 5. Preparar datos del gráfico
        ChartSeriesDTO fromPole = new ChartSeriesDTO("From Pole", "#2ecc71", List.of((double) winsFromPole));
        ChartSeriesDTO fromBehind = new ChartSeriesDTO("From other position", "#e74c3c", List.of((double) winsNotFromPole));

        return new ChartDataDTO(
                chartI18n.get("poleWinRateAtCircuit", lang) + circuitRef,
                "bar",
                List.of("Wins"),
                List.of(fromPole, fromBehind)
        );
    }



    @Override
    public ChartDataDTO getChampionshipProgressTop2Drivers(String seasonStr, String lang) {
        int targetSeason = Integer.parseInt(seasonStr);

        // 1. Obtener todas las carreras del año ordenadas
        List<Race> races = raceDao.findAll().stream()
                .filter(r -> r.getYear() == targetSeason)
                .sorted(Comparator.comparingInt(Race::getRound))
                .toList();

        if (races.isEmpty()) {
            return new ChartDataDTO("No races for season " + targetSeason, "line", List.of(), List.of());
        }

        // 2. Obtener la última carrera para determinar top 2 final
        Race finalRace = races.get(races.size() - 1);
        List<DriverStanding> finalStandings = driverStandingDao.findByRaceIdOrderByPositionAsc(finalRace.getRaceId());
        if (finalStandings.size() < 2) {
            return new ChartDataDTO("Incomplete standings", "line", List.of(), List.of());
        }

        Long driverId1 = finalStandings.get(0).getDriverId();
        Long driverId2 = finalStandings.get(1).getDriverId();

        Driver d1 = driverDao.findById(driverId1).orElse(null);
        Driver d2 = driverDao.findById(driverId2).orElse(null);
        if (d1 == null || d2 == null) return new ChartDataDTO("Driver not found", "line", List.of(), List.of());

        String name1 = d1.getForename() + " " + d1.getSurname();
        String name2 = d2.getForename() + " " + d2.getSurname();

        // 3. Obtener todos los driverstandings del año filtrados por esos dos pilotos
        Set<Long> raceIds = races.stream().map(Race::getRaceId).collect(Collectors.toSet());
        Map<Long, Double> points1 = new HashMap<>();
        Map<Long, Double> points2 = new HashMap<>();

        for (DriverStanding ds : driverStandingDao.findAll()) {
            if (!raceIds.contains(ds.getRaceId())) continue;

            if (ds.getDriverId().equals(driverId1)) {
                points1.put(ds.getRaceId(), ds.getPoints());
            } else if (ds.getDriverId().equals(driverId2)) {
                points2.put(ds.getRaceId(), ds.getPoints());
            }
        }

        // 4. Construir series en el mismo orden de las carreras
        List<String> labels = races.stream().map(Race::getName).toList();
        List<Double> series1 = races.stream()
                .map(r -> points1.getOrDefault(r.getRaceId(), null))
                .toList();
        List<Double> series2 = races.stream()
                .map(r -> points2.getOrDefault(r.getRaceId(), null))
                .toList();

        ChartSeriesDTO s1 = new ChartSeriesDTO(name1, getDriverColor(driverId1), series1);
        ChartSeriesDTO s2 = new ChartSeriesDTO(name2, getDriverColor(driverId2), series2);

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
        Map<Long, String> driverNames = driverDao.findAll().stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d.getForename() + " " + d.getSurname()));

        // Map<position, Map<driverId, count>>
        Map<Integer, Map<Long, Integer>> histogram = new TreeMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getPositionOrder() == null) continue;
            int position = r.getPositionOrder();
            long driverId = r.getDriver().getDriverId();

            histogram.computeIfAbsent(position, k -> new HashMap<>())
                    .merge(driverId, 1, Integer::sum);
        }

        List<String> labels = histogram.keySet().stream().map(String::valueOf).toList();
        Map<Long, List<Double>> seriesMap = new HashMap<>();

        for (Map.Entry<Integer, Map<Long, Integer>> entry : histogram.entrySet()) {
            int pos = entry.getKey();
            for (Map.Entry<Long, Integer> e : entry.getValue().entrySet()) {
                seriesMap.computeIfAbsent(e.getKey(), k -> new ArrayList<>());
            }
        }

        for (Long driverId : seriesMap.keySet()) {
            for (Integer pos : histogram.keySet()) {
                int count = histogram.get(pos).getOrDefault(driverId, 0);
                seriesMap.get(driverId).add((double) count);
            }
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> datasets = seriesMap.entrySet().stream()
                .map(e -> {
                    String name = driverNames.getOrDefault(e.getKey(), "Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, e.getValue());
                }).toList();

        return new ChartDataDTO(chartI18n.get("finishPositionDistribution", lang), "bar", labels, datasets);
    }


    @Override
    public ChartDataDTO getFinishVsDNFRatio(String lang) {
        List<Driver> drivers = driverDao.findAll();
        Map<Long, String> driverNames = drivers.stream()
                .collect(Collectors.toMap(Driver::getDriverId, d -> d.getForename() + " " + d.getSurname()));

        Set<String> finishStatus = Set.of("finished", "classified");

        Map<Long, int[]> stats = new HashMap<>(); // [0] = finishes, [1] = dnfs

        for (Result r : resultDao.findAll()) {
            Long driverId = r.getDriver().getDriverId();
            String status = r.getStatus().getStatus().toLowerCase();
            boolean finished = status.contains("finished") || status.contains("classified");

            int[] arr = stats.computeIfAbsent(driverId, k -> new int[2]);
            if (finished) arr[0]++;
            else arr[1]++;
        }

        List<String> labels = List.of("Finished", "DNF");

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = stats.entrySet().stream()
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


        return new ChartDataDTO(chartI18n.get("finishVsDNFRatio", lang), "bar", labels, dataset);
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



    @Override
    public ChartDataDTO getGridVsResultDeltaByConstructor(String lang) {
        Map<Long, String> constructorNames = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, Constructor::getName));

        Map<Long, List<Integer>> deltas = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getPositionOrder() == null) continue;
            int delta = r.getGrid() - r.getPositionOrder();
            Long constructorId = r.getConstructor().getConstructorId();
            deltas.computeIfAbsent(constructorId, k -> new ArrayList<>()).add(delta);
        }

        AtomicInteger idx = new AtomicInteger();
        List<ChartSeriesDTO> dataset = deltas.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    String name = constructorNames.getOrDefault(e.getKey(), "Team " + e.getKey());
                    String color = getColorForIndex(idx.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(avg));
                }).toList();


        return new ChartDataDTO(chartI18n.get("gridToResultDeltaByConstructor", lang), "bar",
                List.of("Avg Δ (grid - finish)"), dataset);
    }

    @Override
    public ChartDataDTO getReliabilityBySeason(String lang) {
        Set<String> nonFinishStatuses = Set.of(
                "accident", "collision", "collision damage", "engine", "gearbox", "hydraulics", "electrical",
                "suspension", "brakes", "fuel", "puncture", "tyre", "wheel", "steering", "transmission",
                "overheating", "driveshaft", "clutch", "chassis", "mechanical", "exhaust", "radiator",
                "oil leak", "oil pressure", "fire", "power unit", "power loss", "turbo", "water leak",
                "water pump", "brake duct", "electrics", "differential", "drivetrain"
        );


        Map<Long, String> constructorNames = constructorDao.findAll().stream()
                .collect(Collectors.toMap(Constructor::getConstructorId, Constructor::getName));

        Map<Long, Map<Integer, int[]>> data = new HashMap<>(); // constructor → year → [participaciones, abandonos]

        for (Result r : resultDao.findAll()) {
            if (r.getConstructor() == null || r.getStatus() == null) continue;
            int year = r.getRace().getYear();
            String status = r.getStatus().getStatus().toLowerCase();
            Long constructorId = r.getConstructor().getConstructorId();

            boolean dnf = nonFinishStatuses.stream().anyMatch(status::contains);

            data.computeIfAbsent(constructorId, k -> new HashMap<>())
                    .computeIfAbsent(year, y -> new int[2]);

            int[] arr = data.get(constructorId).get(year);
            arr[0]++; // participación
            if (dnf) arr[1]++; // abandono
        }

        Set<Integer> allYears = data.values().stream()
                .flatMap(m -> m.keySet().stream())
                .collect(Collectors.toCollection(TreeSet::new));
        List<String> labels = allYears.stream().map(String::valueOf).toList();

        List<ChartSeriesDTO> datasets = new ArrayList<>();

        for (Map.Entry<Long, Map<Integer, int[]>> entry : data.entrySet()) {
            String label = constructorNames.getOrDefault(entry.getKey(), "Team " + entry.getKey());
            List<Double> values = new ArrayList<>();
            for (Integer year : allYears) {
                int[] arr = entry.getValue().getOrDefault(year, new int[]{0, 0});
                double ratio = (arr[0] == 0) ? Double.NaN : 100.0 * (arr[0] - arr[1]) / arr[0];
                values.add(ratio);
            }
            datasets.add(new ChartSeriesDTO(label, "#8884d8", values));
        }

        return new ChartDataDTO(chartI18n.get("reliabilityBySeason", lang), "line", labels, datasets);
    }

    @Override
    public ChartDataDTO getAverageRaceDurationPerSeason(String lang) {
        Map<Integer, List<Long>> seasonDurations = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getPositionOrder() != null && r.getPositionOrder() == 1 && r.getMilliseconds() != null) {
                int year = r.getRace().getYear();
                seasonDurations.computeIfAbsent(year, k -> new ArrayList<>())
                        .add(r.getMilliseconds().longValue());
            }
        }

        List<Integer> years = new ArrayList<>(seasonDurations.keySet());
        Collections.sort(years);
        List<String> labels = years.stream().map(String::valueOf).toList();

        List<Double> values = years.stream()
                .map(y -> seasonDurations.get(y).stream().mapToLong(l -> l).average().orElse(0) / 60000.0) // ← conversión a minutos
                .toList();

        return new ChartDataDTO(
                chartI18n.get("avgRaceDurationPerSeason", lang),
                "line",
                labels,
                List.of(new ChartSeriesDTO("Duration (min)", "#8884d8", values))
        );
    }



    @Override
    public ChartDataDTO getAvgFastestPitStopPerRace(String lang, String season) {
        Map<Long, List<PitStop>> pitStopsByRace = pitStopDao.findAll().stream()
                .collect(Collectors.groupingBy(PitStop::getRaceId));

        Map<Long, Double> minPitStopTimeByRace = new HashMap<>();
        for (Map.Entry<Long, List<PitStop>> e : pitStopsByRace.entrySet()) {
            List<PitStop> stops = e.getValue().stream()
                    .filter(p -> p.getMilliseconds() != null)
                    .toList();
            if (!stops.isEmpty()) {
                long min = stops.stream().mapToLong(PitStop::getMilliseconds).min().orElse(0);
                minPitStopTimeByRace.put(e.getKey(), (double) min);
            }
        }

        List<Race> races = raceDao.findAllOrderByYearAndRound();
        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();

        for (Race r : races) {
            boolean matchesSeason = (season == null || String.valueOf(r.getYear()).equals(season));
            if (matchesSeason && minPitStopTimeByRace.containsKey(r.getRaceId())) {
                labels.add(r.getYear() + " - " + r.getName());
                values.add(minPitStopTimeByRace.get(r.getRaceId()));
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
        Map<Integer, List<Long>> deltas = new HashMap<>();

        for (Qualifying q : qualifyingDao.findAll()) {
            int year = q.getRace().getYear();
            if (year < 2006) continue; // ignorar pre 2006

            Long t1 = parseTimeToMilliseconds(q.getQ1());
            Long t3 = parseTimeToMilliseconds(q.getQ3());
            if (t1 != null && t3 != null) {
                deltas.computeIfAbsent(year, k -> new ArrayList<>()).add(t1 - t3);
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
        Map<Long, List<Long>> q1Map = new HashMap<>();
        Map<Long, List<Long>> q2Map = new HashMap<>();
        Map<Long, List<Long>> q3Map = new HashMap<>();

        for (Qualifying q : qualifyingDao.findAll()) {
            Long driverId = q.getDriver().getDriverId();
            if (driverId == null) continue;

            Long t1 = parseTimeToMilliseconds(q.getQ1());
            Long t2 = parseTimeToMilliseconds(q.getQ2());
            Long t3 = parseTimeToMilliseconds(q.getQ3());

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
        Map<Long, List<Double>> pointsByDriver = new HashMap<>();

        resultDao.findAll().stream()
                .sorted(Comparator.comparing(r -> r.getRace().getDate()))
                .forEach(r -> {
                    Long driverId = r.getDriver().getDriverId();
                    pointsByDriver.computeIfAbsent(driverId, k -> new ArrayList<>()).add(r.getPoints() != null ? r.getPoints() : 0.0);
                });

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = pointsByDriver.entrySet().stream()
                .map(e -> {
                    int maxStreak = 0, current = 0;
                    for (Double pts : e.getValue()) {
                        if (pts > 0) current++;
                        else current = 0;
                        maxStreak = Math.max(maxStreak, current);
                    }
                    String name = driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname()).orElse("Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of((double) maxStreak));
                }).toList();


        return new ChartDataDTO(chartI18n.get("pointsStreaksPerDriver", lang), "bar", List.of("Streak"), dataset);
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
        Map<Integer, List<Double>> speeds = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            if (r.getFastestLapSpeed() != null) {
                speeds.computeIfAbsent(r.getRace().getYear(), k -> new ArrayList<>())
                        .add(r.getFastestLapSpeed());
            }
        }

        List<Integer> years = new ArrayList<>(speeds.keySet());
        Collections.sort(years);

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

        Map<Long, List<Integer>> starts = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            int year = r.getRace().getYear();
            if (year < startYear || year > endYear) continue;
            if (r.getGrid() == null || r.getGrid() <= 0) continue;

            Long driverId = r.getDriver().getDriverId();
            starts.computeIfAbsent(driverId, k -> new ArrayList<>()).add(r.getGrid());
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = starts.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    String name = driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname())
                            .orElse("Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(avg));
                }).toList();

        return new ChartDataDTO(chartI18n.get("avgStartPosition", lang) + " " + decade, "bar", List.of("Start Position"), dataset);
    }


    @Override
    public ChartDataDTO getAverageFinishPositionByDriver(String decade, String lang) {
        int startYear = Integer.parseInt(decade.substring(0, 4));
        int endYear = startYear + 9;

        Map<Long, List<Integer>> finishes = new HashMap<>();

        for (Result r : resultDao.findAll()) {
            int year = r.getRace().getYear();
            if (year < startYear || year > endYear) continue;
            if (r.getPositionOrder() == null || r.getPositionOrder() <= 0) continue;

            Long driverId = r.getDriver().getDriverId();
            finishes.computeIfAbsent(driverId, k -> new ArrayList<>()).add(r.getPositionOrder());
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = finishes.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    String name = driverDao.findById(e.getKey()).map(d -> d.getForename() + " " + d.getSurname())
                            .orElse("Driver " + e.getKey());
                    String color = getColorForIndex(index.getAndIncrement());
                    return new ChartSeriesDTO(name, color, List.of(avg));
                }).toList();

        return new ChartDataDTO(chartI18n.get("avgFinishPosition", lang) + " " + decade, "bar", List.of("Finish Position"), dataset);
    }

    @Override
    public ChartDataDTO getDriverPerformanceTrajectory(String driverIdStr, String lang) {
        Long driverId = Long.parseLong(driverIdStr);

        List<Result> allResults = resultDao.findAll();
        List<Race> allRaces = raceDao.findAllOrderByYearAndRound();

        List<Result> driverResults = allResults.stream()
                .filter(r -> r.getDriver().getDriverId().equals(driverId))
                .toList();

        Map<Integer, Long> constructorPerYear = driverResults.stream()
                .collect(Collectors.toMap(
                        r -> r.getRace().getYear(),
                        r -> r.getConstructor().getConstructorId(),
                        (v1, v2) -> v1
                ));

        Map<Integer, List<Double>> positions = new HashMap<>();
        Map<Integer, Double> points = new HashMap<>();
        for (Result r : driverResults) {
            int year = r.getRace().getYear();
            Double pos = r.getPositionOrder() != null ? r.getPositionOrder().doubleValue() : 30.0; // penaliza DNFs
            positions.computeIfAbsent(year, k -> new ArrayList<>()).add(pos);

            if (r.getPoints() != null) {
                points.merge(year, r.getPoints(), Double::sum);
            }
        }

        Set<Integer> years = new TreeSet<>(positions.keySet());
        List<String> labels = years.stream().map(String::valueOf).toList();

        // Cálculo de puntos del constructor por año y constructorId
        Map<List<Object>, Double> constructorPointsByYear = allResults.stream()
                .filter(r -> r.getConstructor() != null && r.getRace() != null && r.getPoints() != null)
                .collect(Collectors.groupingBy(
                        r -> List.of(r.getRace().getYear(), r.getConstructor().getConstructorId()),
                        Collectors.summingDouble(Result::getPoints)
                ));

        // Duelos con compañero
        Map<Long, List<Result>> resultsByRace = allResults.stream()
                .filter(r -> r.getConstructor() != null && r.getDriver() != null && r.getRace() != null)
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));

        Map<Integer, int[]> teammateBattleStats = new HashMap<>();
        for (List<Result> raceResults : resultsByRace.values()) {
            raceResults.stream()
                    .filter(r -> r.getDriver().getDriverId().equals(driverId))
                    .findFirst()
                    .ifPresent(mainResult -> {
                        Long constructorId = mainResult.getConstructor().getConstructorId();
                        Integer year = mainResult.getRace().getYear();
                        Integer pos = mainResult.getPositionOrder();
                        if (pos == null) return;

                        List<Result> teammates = raceResults.stream()
                                .filter(r -> !r.getDriver().getDriverId().equals(driverId))
                                .filter(r -> r.getConstructor().getConstructorId().equals(constructorId))
                                .filter(r -> r.getPositionOrder() != null)
                                .toList();

                        if (!teammates.isEmpty()) {
                            boolean won = teammates.stream().allMatch(r -> pos < r.getPositionOrder());
                            int[] arr = teammateBattleStats.computeIfAbsent(year, k -> new int[2]);
                            if (won) arr[0]++;
                            arr[1]++;
                        }
                    });
        }

        // Posición final del piloto vs equipo
        Map<Integer, Race> lastRaceByYear = allRaces.stream()
                .collect(Collectors.toMap(
                        Race::getYear,
                        Function.identity(),
                        (oldV, newV) -> newV
                ));

        Map<Integer, Boolean> beatTeamInWdc = new HashMap<>();
        for (Map.Entry<Integer, Race> entry : lastRaceByYear.entrySet()) {
            int year = entry.getKey();
            Long raceId = entry.getValue().getRaceId();

            List<DriverStanding> dsList = driverStandingDao.findByRaceIdOrderByPositionAsc(raceId);
            List<ConstructorStanding> csList = constructorStandingDao.findByRaceIdOrderByPositionAsc(raceId);

            Integer driverPos = dsList.stream()
                    .filter(s -> s.getDriverId().equals(driverId))
                    .map(DriverStanding::getPosition)
                    .findFirst().orElse(null);

            Long constructorId = constructorPerYear.get(year);
            if (constructorId == null) continue;

            Integer teamPos = csList.stream()
                    .filter(cs -> cs.getConstructorId().equals(constructorId))
                    .map(ConstructorStanding::getPosition)
                    .findFirst().orElse(null);

            if (driverPos != null && teamPos != null && driverPos <= teamPos + 1) {
                beatTeamInWdc.put(year, true); // criterio suavizado
            }
        }

        // Calcular índice final
        List<Double> values = years.stream()
                .map(y -> {
                    List<Double> positionList = positions.getOrDefault(y, List.of());
                    double avgPos = positionList.stream().mapToDouble(d -> d).average().orElse(25.0);
                    double stdDev = Math.sqrt(positionList.stream().mapToDouble(p -> Math.pow(p - avgPos, 2)).average().orElse(0));
                    double consistency = 1 / (1 + stdDev); // hasta 1

                    double rawPoints = points.getOrDefault(y, 0.0);
                    long raceCount = positionList.size();
                    int maxPointsPerRace = getMaxPointsPerRace(y);
                    double maxPointsSeason = raceCount * maxPointsPerRace;
                    double normalizedPoints = maxPointsSeason > 0 ? (rawPoints / maxPointsSeason) * 100 : 0;

                    Long constructorId = constructorPerYear.get(y);
                    double teamPoints = constructorId != null ? constructorPointsByYear.getOrDefault(List.of(y, constructorId), 0.0) : 0.0;
                    double pilotShare = teamPoints > 0 ? (rawPoints / teamPoints) : 0.0;
                    double weightMultiplier;
                    if (pilotShare >= 0.69) {
                        weightMultiplier = 0.40;
                    } else if (pilotShare >= 0.65) {
                        weightMultiplier = 0.25;
                    } else {
                        weightMultiplier = 0.15;
                    }

                    double pointsScore = normalizedPoints * weightMultiplier;

                    double teammateScore = 0.0;
                    int[] battleData = teammateBattleStats.getOrDefault(y, new int[]{0, 0});
                    if (battleData[1] >= 5) {
                        int wins = battleData[0];
                        int losses = battleData[1] - battleData[0];
                        int total = battleData[1];

                        double winRatio = (double) wins / total;
                        int diff = wins - losses;
                        double diffFactor = Math.tanh(diff / 5.0);
                        teammateScore = (winRatio * 10 + diffFactor * 10);
                    }

                    double consistencyScore = consistency * 100 * 0.60;

                    double teamRankingBonus = beatTeamInWdc.getOrDefault(y, false) ? 20.0 : 0.0;

                    return pointsScore + consistencyScore + teammateScore + teamRankingBonus;
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
                .map(c -> c.getConstructorRef())
                .orElse("constructor");

        List<Result> allResults = resultDao.findAll();
        List<Race> allRaces = raceDao.findAllOrderByYearAndRound();

        // Filtramos todos los resultados del constructor
        List<Result> teamResults = allResults.stream()
                .filter(r -> r.getConstructor() != null && r.getConstructor().getConstructorId().equals(constructorId))
                .toList();

        // Agrupamos por año
        Map<Integer, List<Integer>> positionsByYear = new HashMap<>();
        Map<Integer, Double> pointsByYear = new HashMap<>();
        for (Result r : teamResults) {
            int year = r.getRace().getYear();
            if (r.getPositionOrder() != null) {
                positionsByYear.computeIfAbsent(year, k -> new ArrayList<>()).add(r.getPositionOrder());
            }
            if (r.getPoints() != null) {
                pointsByYear.merge(year, r.getPoints(), Double::sum);
            }
        }

        Set<Integer> years = new TreeSet<>(positionsByYear.keySet());
        List<String> labels = years.stream().map(String::valueOf).toList();

        // Posición final del equipo en el campeonato de constructores por año
        Map<Integer, Integer> constructorsChampPos = new HashMap<>();
        Map<Integer, Race> lastRaceByYear = allRaces.stream()
                .collect(Collectors.toMap(
                        Race::getYear,
                        Function.identity(),
                        (oldV, newV) -> newV
                ));
        for (Map.Entry<Integer, Race> entry : lastRaceByYear.entrySet()) {
            int year = entry.getKey();
            Long raceId = entry.getValue().getRaceId();

            List<ConstructorStanding> csList = constructorStandingDao.findByRaceIdOrderByPositionAsc(raceId);
            csList.stream()
                    .filter(cs -> cs.getConstructorId().equals(constructorId))
                    .map(ConstructorStanding::getPosition)
                    .findFirst()
                    .ifPresent(pos -> constructorsChampPos.put(year, pos));
        }

        // Cálculo final del índice por año
        List<Double> values = years.stream()
                .map(y -> {
                    List<Integer> posList = positionsByYear.getOrDefault(y, List.of());
                    double avgPos = posList.stream().mapToInt(p -> p).average().orElse(20.0);
                    double stdDev = Math.sqrt(posList.stream().mapToDouble(p -> Math.pow(p - avgPos, 2)).average().orElse(0));
                    double consistency = 1 / (1 + stdDev); // hasta 1
                    double consistencyScore = consistency * 100 * 0.35; // hasta 35 puntos

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
                })
                .toList();

        String name = constructorDao.findById(constructorId)
                .map(c -> c.getName())
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
        Map<Integer, Integer> histogram = new TreeMap<>(); // delta → count

        for (Result r : resultDao.findAll()) {
            if (r.getGrid() == null || r.getPositionOrder() == null) continue;
            int delta = r.getGrid() - r.getPositionOrder();
            if (Math.abs(delta) > 15) continue; // limitar extremos
            histogram.merge(delta, 1, Integer::sum);
        }

        List<String> labels = histogram.keySet().stream()
                .map(String::valueOf).toList();
        List<Double> values = histogram.values().stream()
                .map(Integer::doubleValue).toList();

        return new ChartDataDTO(chartI18n.get("qualiToRaceDeltaHistogram", lang), "bar", labels,
                List.of(new ChartSeriesDTO("Drivers", "#0088FE", values)));
    }


    @Override
    public ChartDataDTO getQualiConsistencyScorePerDriver(String lang) {
        Map<Long, List<Integer>> qualiPositions = new HashMap<>();

        for (Qualifying q : qualifyingDao.findAll()) {
            if (q.getPosition() == null) continue;
            qualiPositions
                    .computeIfAbsent(q.getDriver().getDriverId(), k -> new ArrayList<>())
                    .add(q.getPosition());
        }

        AtomicInteger index = new AtomicInteger(0);
        List<ChartSeriesDTO> dataset = qualiPositions.entrySet().stream()
                .filter(e -> e.getValue().size() >= 5)
                .map(e -> {
                    double avg = e.getValue().stream().mapToInt(i -> i).average().orElse(0);
                    double variance = e.getValue().stream()
                            .mapToDouble(i -> Math.pow(i - avg, 2))
                            .average()
                            .orElse(0.0);
                    double stdDev = Math.sqrt(variance); // ⬅️ aquí convertimos varianza a desviación estándar

                    String name = driverDao.findById(e.getKey())
                            .map(d -> d.getForename() + " " + d.getSurname())
                            .orElse("Driver " + e.getKey());
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