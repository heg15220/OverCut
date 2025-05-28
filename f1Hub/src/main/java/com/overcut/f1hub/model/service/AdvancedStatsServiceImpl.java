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
    public ChartDataDTO getAveragePointsPerSeasonByDriver(String decade) {
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

        // Filtrar por década si se ha pasado el parámetro
        int startYear = 0;
        int endYear = 0;
        if (decade != null) {
            switch (decade) {
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
            }
        }

        for (Result r : resultDao.findAll()) {
            Long driverId = r.getDriver().getDriverId();
            Integer year = raceYearMap.get(r.getRace().getRaceId());
            Double points = r.getPoints();

            if (year == null || points == null) continue;

            // Filtrar por la década
            if (year < startYear || year > endYear) continue;

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

            // Variable para comprobar si el piloto tiene puntos en alguna temporada
            boolean hasPoints = false;

            for (Integer year : allYears) {
                List<Double> pts = entry.getValue().getOrDefault(year, Collections.emptyList());
                if (pts.isEmpty()) {
                    data.add(null); // null → ECharts no dibuja nada, evita falsas líneas
                } else {
                    double averagePoints = pts.stream().mapToDouble(d -> d).average().orElse(0.0);
                    data.add(averagePoints);
                }
            }


            datasets.add(new ChartSeriesDTO(label, "#8884d8", data)); // Puedes reemplazar el color por nacionalidad
        }

        return new ChartDataDTO("Promedio de puntos por temporada", "line", yearLabels, datasets);

    }


    //Is called getVictoryPercentageByDriverPerSeason but refers to wins percentage by DECADE, not season
    public ChartDataDTO getVictoryPercentageByDriverPerSeason(String decade) {
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
        datasets.add(new ChartSeriesDTO("Victorias", labels, data));

        // Paso 9: Preparar el resultado del gráfico
        return new ChartDataDTO(
                "Porcentaje de victorias por década",
                "pie", // Tipo de gráfico circular
                List.of(decade + "s"), // Etiquetas de las décadas
                datasets
        );
    }


    @Override
    public ChartDataDTO getPodiumPercentageVsTeammate(String decade) {
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
        List<Result> allResults = resultDao.findAll();

        Map<Long, String> driverNames = allDrivers.stream()
                .collect(Collectors.toMap(
                        Driver::getDriverId,
                        d -> d.getForename() + " " + d.getSurname()
                ));

        // Map<driverId, Map<year, constructorRef>>
        Map<Long, Map<Integer, String>> driverYearTeamMap = new HashMap<>();
        for (Result r : allResults) {
            if (r.getDriver() == null || r.getRace() == null || r.getConstructor() == null) continue;
            Integer year = r.getRace().getYear();
            if (year < startYear || year > endYear) continue;

            Long dId = r.getDriver().getDriverId();
            String constructorRef = r.getConstructor().getConstructorRef();

            driverYearTeamMap
                    .computeIfAbsent(dId, k -> new HashMap<>())
                    .putIfAbsent(year, constructorRef); // asumimos un equipo por año
        }

        // Labels comunes (años dentro de la década)
        Set<Integer> allYears = allResults.stream()
                .map(r -> r.getRace().getYear())
                .filter(y -> y >= fromYear && y <= toYear)
                .collect(Collectors.toCollection(TreeSet::new));
        List<String> labels = new ArrayList<>();
        for (Integer year : allYears) {
            labels.add(String.valueOf(year));
        }


        List<ChartSeriesDTO> seriesList = new ArrayList<>();

        for (Driver d : allDrivers) {
            String forename = d.getForename();
            String surname = d.getSurname();
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

                long driverPodiums = resultDao.countPodiumsByDriverInYear(forename, surname, year);
                long teamPodiums = resultDao.countPodiumsByConstructorInYear(constructorRef, year);

                if (driverPodiums > 0) totalPodiums += driverPodiums;

                double percentage = (teamPodiums == 0) ? 0.0 : (100.0 * driverPodiums) / teamPodiums;
                data.add(percentage);
            }

            if (totalPodiums > 0) {
                seriesList.add(new ChartSeriesDTO(driverNames.get(driverId), "#8884d8", data));
            }
        }

        // Línea de referencia al 50%
        List<Double> fiftyLine = new ArrayList<>(Collections.nCopies(labels.size(), 50.0));
        seriesList.add(new ChartSeriesDTO("50%", "#999999", fiftyLine));


        return new ChartDataDTO("Porcentaje de podios vs compañero", "line", labels, seriesList);
    }







    @Override
    public ChartDataDTO getQ3PercentageVsTeammate(String driverIdStr) {
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
                "Porcentaje de clasificación vs compañero (" + driverName + ")",
                "line",
                labels,
                List.of(
                        new ChartSeriesDTO(driverName, "#ff7f50", data),
                        new ChartSeriesDTO("50%", "#999999", fiftyLine)
                )
        );
    }





    @Override
    public ChartDataDTO getAverageAccidentsBySeason() {
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

        return new ChartDataDTO("Promedio de accidentes por temporada", "line", labels, List.of(
                new ChartSeriesDTO("Accidentes por carrera", "#ff7300", data)
        ));
    }

    @Override
    public ChartDataDTO getAverageRetirementsBySeason() {
        // Lista de status que NO se consideran abandonos
        Set<String> excludedStatuses = Set.of(
                "did not qualify",
                "disqualified",
                "did not start",
                "finished",
                "not classified"
        );

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
                    .filter(status -> !excludedStatuses.contains(status))
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
                "Promedio de abandonos por temporada",
                "line",
                labels,
                List.of(new ChartSeriesDTO("Abandonos por carrera", "#cc0000", data))
        );
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
        List<String> labels = List.of("Victorias desde P3 o peor");

        return new ChartDataDTO("Victorias desde P3 o peor", "bar", labels, dataset);
    }


    @Override
    public ChartDataDTO getPodiumsFrom3rdOrWorse() {
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
        List<String> labels = List.of("Podios desde P3 o peor");

        return new ChartDataDTO("Podios desde P3 o peor", "bar", labels, dataset);
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
    public ChartDataDTO getDriverVsTeamChampionshipFinish(String decade) {
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

        String title = "Pilotos que superaron o igualaron a su equipo en el campeonato"
                + (finalStartYear > 0 ? " (" + finalStartYear + "s)" : "");

        return new ChartDataDTO(title, "bar", List.of("Veces"), dataset);
    }



    @Override
    public ChartDataDTO getWinsWithoutTop2() {
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
                "Victorias sin salir desde 1ª o 2ª posición",
                "bar",
                List.of("Victorias desde P3+"),
                dataset
        );
    }



    // Implementación
    @Override
    public ChartDataDTO getTeamComebacksBySeason(String decade) {
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
    public ChartDataDTO getAvgPointsPerTeamPerSeason(String decade) {
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
        return new ChartDataDTO("Cambios de Posición por carrera (" + year + ")", "bar", labels,
                List.of(new ChartSeriesDTO("Cambios de Posición", "#00c49f", values)));
    }


    @Override
    public ChartDataDTO getAvgOvertakesPerSeason() {
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
        return new ChartDataDTO("Promedio de cambios de posición por temporada", "line", labels,
                List.of(new ChartSeriesDTO("Cambios de Posición promedio", "#0088fe", values)));
    }


    @Override
    public ChartDataDTO getPointsDeltaVsTeammate(String seasonStr) {
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
                "Diferencia media de puntos vs compañero (" + season + ")",
                "bar",
                List.of("Δ puntos"),
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
    public ChartDataDTO getAverageQualiGapBetween1stAnd2ndPerSeason() {
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
                "Promedio de diferencia entre P1 y P2 en clasificación por temporada",
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap en ms", "#00C49F", data))
        );
    }


    @Override
    public ChartDataDTO getAverageQualiGapBetween10thAndPolePerSeason() {
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
                "Promedio de diferencia entre P10 y la pole por temporada",
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap en ms", "#FFBB28", data))
        );
    }


    @Override
    public ChartDataDTO getAverageRaceGapBetween1stAnd2ndPerSeason() {
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
                "Promedio de diferencia entre P1 y P2 en carrera por temporada",
                "line",
                labels,
                List.of(new ChartSeriesDTO("Gap en ms", "#FF4444", data))
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
}