package com.overcut.predictions.model.service;

import com.overcut.predictions.model.dao.ConstructorDao;
import com.overcut.predictions.model.dao.DriverDao;
import com.overcut.predictions.model.dao.RaceDao;
import com.overcut.predictions.model.dao.ResultDao;
import com.overcut.predictions.model.dto.*;
import com.overcut.predictions.model.entities.Constructor;
import com.overcut.predictions.model.entities.Driver;
import com.overcut.predictions.model.entities.Race;
import com.overcut.predictions.model.entities.Result;
import com.overcut.predictions.model.rules.PointsSystem;
import com.overcut.predictions.model.rules.PointsSystemFactory;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PredictionBootstrapService {

    private final RaceDao raceDao;
    private final ResultDao resultDao;
    private final DriverDao driverDao;
    private final ConstructorDao constructorDao;

    public PredictionBootstrapService(
            RaceDao raceDao,
            ResultDao resultDao,
            DriverDao driverDao,
            ConstructorDao constructorDao
    ) {
        this.raceDao = raceDao;
        this.resultDao = resultDao;
        this.driverDao = driverDao;
        this.constructorDao = constructorDao;
    }

    /**
     * Bootstraps a season until (fromRound - 1),
     * returning real races and standings + lookups for UI.
     */
    @Transactional
    public PredictionBootstrapDTO bootstrapSeason(
            Integer season,
            Integer fromRound
    ) {
        // 1) Races already completed (real) until fromRound-1
        List<Race> completedRaces =
                raceDao.findByYearAndRoundLessThanOrderByRound(
                        season,
                        fromRound
                );

        PointsSystem pointsSystem =
                PointsSystemFactory.forSeason(season);

        Map<Long, Integer> driverPoints = new HashMap<>();
        Map<Long, Integer> constructorPoints = new HashMap<>();

        // driverId -> constructorId (último constructor visto hasta el momento)
        Map<Long, Long> driverToConstructor = new HashMap<>();

        List<PredictionRaceDTO> raceDTOs = new ArrayList<>();

        for (Race race : completedRaces) {

            List<Result> results =
                    resultDao.findByRaceId(race.getRaceId());

            PredictionRaceDTO raceDTO = new PredictionRaceDTO();
            raceDTO.setRaceId(race.getRaceId());
            raceDTO.setRound(race.getRound());
            raceDTO.setRaceName(race.getName());

            List<PredictionResultDTO> resultDTOs = new ArrayList<>();

            for (Result result : results) {

                int pts;

                if (season >= 2010) {
                    // Trust DB points for modern seasons
                    // (si DB devuelve null en algún caso raro, protegemos)
                    pts = (result.getPoints() != null) ? result.getPoints() : 0;
                } else {
                    // Recalculate for historical seasons
                    Integer pos = result.getPosition();
                    pts = (pos != null) ? pointsSystem.pointsForPosition(pos) : 0;
                }

                PredictionResultDTO r = new PredictionResultDTO();
                r.setDriverId(result.getDriverId());
                r.setConstructorId(result.getConstructorId());
                r.setPosition(result.getPosition());
                r.setPoints(pts);

                resultDTOs.add(r);

                if (result.getDriverId() != null) {
                    driverPoints.merge(result.getDriverId(), pts, Integer::sum);
                }
                if (result.getConstructorId() != null) {
                    constructorPoints.merge(result.getConstructorId(), pts, Integer::sum);
                }

                // mapping para simulación (último constructor visto para ese driver)
                if (result.getDriverId() != null && result.getConstructorId() != null) {
                    driverToConstructor.put(result.getDriverId(), result.getConstructorId());
                }
            }

            raceDTO.setResults(resultDTOs);
            raceDTOs.add(raceDTO);
        }

        // 2) Lookups para mostrar nombres en UI (drivers / constructors / race names)
        PredictionLookupsDTO lookups = buildLookups(season, completedRaces, driverPoints, constructorPoints);

        // 3) totalRounds de la temporada (para dropdowns y validaciones UI)
        Integer totalRounds = computeTotalRoundsForSeason(season);

        // 4) Build DTO response
        PredictionBootstrapDTO dto = new PredictionBootstrapDTO();
        dto.setSeason(season);
        dto.setSimulatedFromRound(fromRound);
        dto.setTotalRounds(totalRounds);

        dto.setCompletedRaces(raceDTOs);

        dto.setDriverStandings(buildStandings(driverPoints));
        dto.setConstructorStandings(buildStandings(constructorPoints));

        dto.setLookups(lookups);
        dto.setDriverToConstructor(driverToConstructor);

        return dto;
    }

    private PredictionLookupsDTO buildLookups(
            Integer season,
            List<Race> completedRaces,
            Map<Long, Integer> driverPoints,
            Map<Long, Integer> constructorPoints
    ) {
        PredictionLookupsDTO lookups = new PredictionLookupsDTO();

        // --- driverId -> "Forename Surname"
        Set<Long> driverIds = driverPoints.keySet();
        Map<Long, String> driverNames = new HashMap<>();
        if (!driverIds.isEmpty()) {
            Iterable<Driver> drivers = driverDao.findAllById(driverIds);
            for (Driver d : drivers) {
                String fullName =
                        ((d.getForename() != null) ? d.getForename() : "").trim()
                                + " "
                                + ((d.getSurname() != null) ? d.getSurname() : "").trim();
                driverNames.put(d.getDriverId(), fullName.trim().isEmpty() ? ("Driver " + d.getDriverId()) : fullName.trim());
            }
        }
        lookups.setDriverNames(driverNames);

        // --- constructorId -> name
        Set<Long> constructorIds = constructorPoints.keySet();
        Map<Long, String> constructorNames = new HashMap<>();
        if (!constructorIds.isEmpty()) {
            Iterable<Constructor> constructors = constructorDao.findAllById(constructorIds);
            for (Constructor c : constructors) {
                String name = (c.getName() != null && !c.getName().trim().isEmpty())
                        ? c.getName().trim()
                        : ("Constructor " + c.getConstructorId());
                constructorNames.put(c.getConstructorId(), name);
            }
        }
        lookups.setConstructorNames(constructorNames);

        // --- round -> raceName (para las carreras ya completadas)
        // (más adelante lo haremos de TODA la temporada en frontend con dto.totalRounds + endpoint dedicado si quieres)
        Map<Integer, String> raceNamesByRound = new LinkedHashMap<>();
        for (Race r : completedRaces) {
            if (r.getRound() != null) {
                raceNamesByRound.put(r.getRound(), r.getName());
            }
        }
        lookups.setRaceNamesByRound(raceNamesByRound);

        return lookups;
    }

    /**
     * Devuelve el max round real de la temporada.
     * Implementación simple sin tocar RaceDao: findAll() y filtrar por year.
     * (son pocas filas por season; perfecto para empezar).
     */
    private Integer computeTotalRoundsForSeason(Integer season) {
        List<Race> allSeasonRaces = raceDao.findAll()
                .stream()
                .filter(r -> Objects.equals(r.getYear(), season))
                .sorted(Comparator.comparing(Race::getRound, Comparator.nullsLast(Integer::compareTo)))
                .collect(Collectors.toList());

        Integer max = 0;
        for (Race r : allSeasonRaces) {
            if (r.getRound() != null) {
                max = Math.max(max, r.getRound());
            }
        }
        return (max == 0) ? null : max;
    }

    private List<StandingsEntryDTO> buildStandings(
            Map<Long, Integer> pointsMap
    ) {
        List<StandingsEntryDTO> list = new ArrayList<>();

        for (Map.Entry<Long, Integer> e : pointsMap.entrySet()) {
            list.add(new StandingsEntryDTO(e.getKey(), e.getValue()));
        }

        list.sort((a, b) -> b.getPoints().compareTo(a.getPoints()));
        return list;
    }
}
