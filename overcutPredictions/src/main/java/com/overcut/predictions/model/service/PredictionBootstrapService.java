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
    public PredictionBootstrapDTO bootstrapSeason(Integer season, Integer fromRound, Integer pointsEra) {

        int key = (pointsEra != null ? pointsEra : season);
        PointsSystem pointsSystem = PointsSystemFactory.forSeason(key);

        // ✅ si pointsEra != season => recalculamos puntos por posición incluso en 2010+
        boolean overridePoints = (pointsEra != null && !pointsEra.equals(season));

        // 1) Races already completed (real) until fromRound-1
        List<Race> completedRaces =
                raceDao.findByYearAndRoundLessThanOrderByRound(
                        season,
                        fromRound
                );

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

                int pts = computePts(result, season, pointsSystem, overridePoints);

                PredictionResultDTO r = new PredictionResultDTO();
                r.setDriverId(result.getDriverId());
                r.setConstructorId(result.getConstructorId());
                r.setPosition(result.getPositionOrder());
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
        PredictionLookupsDTO lookups = buildLookups(season, driverToConstructor);

        // ✅ Completar driverToConstructor para TODOS los pilotos de la season
        if (lookups.getSeasonDrivers() != null) {
            for (SeasonDriverDTO sd : lookups.getSeasonDrivers()) {
                if (sd.getDriverId() != null && sd.getConstructorId() != null) {
                    driverToConstructor.putIfAbsent(sd.getDriverId(), sd.getConstructorId());
                }
            }
        }

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

        dto.setPointsEra(pointsEra);

        boolean hasAnyRaces = (raceDao.findByYearOrderByRound(season).size() > 0);
        boolean hasAnySeasonDrivers = lookups.getSeasonDrivers() != null && !lookups.getSeasonDrivers().isEmpty();

        // Si la BD no tiene nada para esa season:
        if (!hasAnyRaces && !hasAnySeasonDrivers) {
            dto.setMode("empty_db");
        } else {
            dto.setMode("db");
        }

        return dto;
    }

    @Transactional
    public PredictionBootstrapDTO bootstrapSeasonCustom(PredictionBootstrapCustomRequestDTO request) {

        Integer season = request.getSeason();
        Integer fromRound = request.getFromRound();

        // 1) bootstrap real (igual que antes)
        List<Race> completedRaces =
                raceDao.findByYearAndRoundLessThanOrderByRound(season, fromRound);

        Integer pointsEra = request.getPointsEra();
        int key = (pointsEra != null ? pointsEra : season);
        PointsSystem pointsSystem = PointsSystemFactory.forSeason(key);

        // ✅ override si pointsEra != season
        boolean overridePoints = (pointsEra != null && !pointsEra.equals(season));

        Map<Long, Integer> driverPoints = new HashMap<>();
        Map<Long, Integer> constructorPoints = new HashMap<>();
        Map<Long, Long> driverToConstructor = new HashMap<>();

        List<PredictionRaceDTO> raceDTOs = new ArrayList<>();

        for (Race race : completedRaces) {

            List<Result> results = resultDao.findByRaceId(race.getRaceId());

            PredictionRaceDTO raceDTO = new PredictionRaceDTO();
            raceDTO.setRaceId(race.getRaceId());
            raceDTO.setRound(race.getRound());
            raceDTO.setRaceName(race.getName());

            List<PredictionResultDTO> resultDTOs = new ArrayList<>();

            for (Result result : results) {

                int pts = computePts(result, season, pointsSystem, overridePoints);

                PredictionResultDTO r = new PredictionResultDTO();
                r.setDriverId(result.getDriverId());
                r.setConstructorId(result.getConstructorId());
                r.setPosition(result.getPositionOrder());
                r.setPoints(pts);

                resultDTOs.add(r);

                if (result.getDriverId() != null) driverPoints.merge(result.getDriverId(), pts, Integer::sum);
                if (result.getConstructorId() != null) constructorPoints.merge(result.getConstructorId(), pts, Integer::sum);

                if (result.getDriverId() != null && result.getConstructorId() != null) {
                    driverToConstructor.put(result.getDriverId(), result.getConstructorId());
                }
            }

            raceDTO.setResults(resultDTOs);
            raceDTOs.add(raceDTO);
        }

        // 2) lookups MIX: BD + custom
        PredictionLookupsDTO lookups = buildLookupsCustom(
                season,
                driverToConstructor,
                request.getCustomRaces(),
                request.getCustomDrivers(),
                request.getCustomConstructors(),
                request.getCustomDriverToConstructor()
        );

        // ✅ Completar driverToConstructor para TODOS los pilotos (clave para constructores)
        if (lookups.getSeasonDrivers() != null) {
            for (SeasonDriverDTO sd : lookups.getSeasonDrivers()) {
                if (sd.getDriverId() != null && sd.getConstructorId() != null) {
                    driverToConstructor.putIfAbsent(sd.getDriverId(), sd.getConstructorId());
                }
            }
        }

        // 3) totalRounds = max(DB, custom)
        Integer totalRounds = computeTotalRoundsForSeason(season);

        Integer customMax = 0;
        if (request.getCustomRaces() != null) {
            for (CustomRaceDTO cr : request.getCustomRaces()) {
                if (cr.getRound() != null) customMax = Math.max(customMax, cr.getRound());
            }
        }
        if (totalRounds == null) totalRounds = (customMax == 0 ? null : customMax);
        else totalRounds = Math.max(totalRounds, customMax);

        // 4) driverToConstructor: custom overrides
        if (request.getCustomDriverToConstructor() != null) {
            driverToConstructor.putAll(request.getCustomDriverToConstructor());
        }

        PredictionBootstrapDTO dto = new PredictionBootstrapDTO();
        dto.setSeason(season);
        dto.setSimulatedFromRound(fromRound);
        dto.setTotalRounds(totalRounds);
        dto.setCompletedRaces(raceDTOs);

        dto.setDriverStandings(buildStandings(driverPoints));
        dto.setConstructorStandings(buildStandings(constructorPoints));

        dto.setLookups(lookups);
        dto.setDriverToConstructor(driverToConstructor);

        dto.setMode("custom");
        dto.setCustomConfig(request);

        dto.setPointsEra(pointsEra);

        return dto;
    }

    // ---------------------------------------------------------------------
    // ✅ Helper: cálculo de puntos con override por pointsEra
    // ---------------------------------------------------------------------
    private int computePts(Result result, Integer season, PointsSystem pointsSystem, boolean overridePoints) {

        // Si NO se está sobreescribiendo y es 2010+, usamos puntos de BD (incluye sprint/fastest lap si la BD lo trae)
        if (!overridePoints && season != null && season >= 2010) {
            return (result.getPoints() != null) ? (int) Math.round(result.getPoints()) : 0;
        }

        // Si se sobreescribe (o es <2010): recalculamos según posición con el pointsSystem elegido
        Integer pos = result.getPositionOrder();
        return (pos != null) ? pointsSystem.pointsForPosition(pos) : 0;
    }

    private PredictionLookupsDTO buildLookups(
            Integer season,
            Map<Long, Long> driverToConstructor
    ) {
        PredictionLookupsDTO lookups = new PredictionLookupsDTO();

        // 1) TODAS las carreras del año => round -> raceName
        List<Race> allSeasonRaces = raceDao.findByYearOrderByRound(season);

        Map<Integer, String> raceNamesByRound = new LinkedHashMap<>();
        for (Race r : allSeasonRaces) {
            if (r.getRound() != null) raceNamesByRound.put(r.getRound(), r.getName());
        }
        lookups.setRaceNamesByRound(raceNamesByRound);

        // 2) Pilotos de la temporada (distinct)
        List<Object[]> pairs = resultDao.findSeasonDriverConstructors(season);

        Set<Long> seasonDriverIds = new HashSet<>();
        Set<Long> seasonConstructorIds = new HashSet<>();

        // fallback si driverToConstructor no tiene el driver (por ejemplo si fromRound es muy bajo)
        Map<Long, Long> fallbackDriverToConstructor = new HashMap<>();

        for (Object[] row : pairs) {
            Long driverId = (Long) row[0];
            Long constructorId = (Long) row[1];

            if (driverId != null) seasonDriverIds.add(driverId);
            if (constructorId != null) seasonConstructorIds.add(constructorId);

            if (driverId != null && constructorId != null) {
                // fallback (por si no hay carreras completadas)
                fallbackDriverToConstructor.putIfAbsent(driverId, constructorId);

                // ✅ CLAVE: materializa también el mapping que usará la simulación
                driverToConstructor.putIfAbsent(driverId, constructorId);
            }
        }

        // 3) driverId -> nombre completo
        Map<Long, String> driverNames = new HashMap<>();
        if (!seasonDriverIds.isEmpty()) {
            Iterable<Driver> drivers = driverDao.findAllById(seasonDriverIds);
            for (Driver d : drivers) {
                String fullName =
                        ((d.getForename() != null) ? d.getForename() : "").trim()
                                + " "
                                + ((d.getSurname() != null) ? d.getSurname() : "").trim();
                String name = fullName.trim().isEmpty() ? ("Driver " + d.getDriverId()) : fullName.trim();
                driverNames.put(d.getDriverId(), name);
            }
        }
        lookups.setDriverNames(driverNames);

        // 4) constructorId -> name
        Map<Long, String> constructorNames = new HashMap<>();
        if (!seasonConstructorIds.isEmpty()) {
            Iterable<Constructor> constructors = constructorDao.findAllById(seasonConstructorIds);
            for (Constructor c : constructors) {
                String name = (c.getName() != null && !c.getName().trim().isEmpty())
                        ? c.getName().trim()
                        : ("Constructor " + c.getConstructorId());
                constructorNames.put(c.getConstructorId(), name);
            }
        }
        lookups.setConstructorNames(constructorNames);

        // 5) seasonDrivers: lista para UI (drag & drop)
        List<SeasonDriverDTO> seasonDrivers = new ArrayList<>();
        for (Long driverId : seasonDriverIds) {
            Long cid = driverToConstructor.get(driverId);
            if (cid == null) cid = fallbackDriverToConstructor.get(driverId);

            String dName = driverNames.getOrDefault(driverId, "Driver " + driverId);
            String cName = (cid != null) ? constructorNames.getOrDefault(cid, "Constructor " + cid) : null;

            seasonDrivers.add(new SeasonDriverDTO(driverId, cid, dName, cName));
        }

        seasonDrivers.sort(Comparator.comparing(SeasonDriverDTO::getDriverName, String.CASE_INSENSITIVE_ORDER));
        lookups.setSeasonDrivers(seasonDrivers);

        return lookups;
    }

    private PredictionLookupsDTO buildLookupsCustom(
            Integer season,
            Map<Long, Long> realDriverToConstructor,
            List<CustomRaceDTO> customRaces,
            List<CustomDriverDTO> customDrivers,
            List<CustomConstructorDTO> customConstructors,
            Map<Long, Long> customDriverToConstructor
    ) {

        PredictionLookupsDTO lookups = new PredictionLookupsDTO();

        // A) Race names by round: BD + custom (custom pisa)
        Map<Integer, String> raceNamesByRound = new LinkedHashMap<>();
        List<Race> allSeasonRaces = raceDao.findByYearOrderByRound(season);
        for (Race r : allSeasonRaces) {
            if (r.getRound() != null) raceNamesByRound.put(r.getRound(), r.getName());
        }
        if (customRaces != null) {
            for (CustomRaceDTO cr : customRaces) {
                if (cr.getRound() != null && cr.getName() != null && !cr.getName().trim().isEmpty()) {
                    raceNamesByRound.put(cr.getRound(), cr.getName().trim());
                }
            }
        }
        lookups.setRaceNamesByRound(raceNamesByRound);

        // B) Drivers/Constructors existentes en results (si hay)
        List<Object[]> pairs = resultDao.findSeasonDriverConstructors(season);

        Set<Long> seasonDriverIds = new HashSet<>();
        Set<Long> seasonConstructorIds = new HashSet<>();
        Map<Long, Long> fallbackDriverToConstructor = new HashMap<>();

        for (Object[] row : pairs) {
            Long driverId = (Long) row[0];
            Long constructorId = (Long) row[1];

            if (driverId != null) seasonDriverIds.add(driverId);
            if (constructorId != null) seasonConstructorIds.add(constructorId);

            if (driverId != null && constructorId != null) {
                fallbackDriverToConstructor.putIfAbsent(driverId, constructorId);
            }
        }

        // C) driverNames: BD + custom
        Map<Long, String> driverNames = new HashMap<>();

        if (!seasonDriverIds.isEmpty()) {
            Iterable<Driver> drivers = driverDao.findAllById(seasonDriverIds);
            for (Driver d : drivers) {
                String fullName =
                        ((d.getForename() != null) ? d.getForename() : "").trim()
                                + " "
                                + ((d.getSurname() != null) ? d.getSurname() : "").trim();
                String name = fullName.trim().isEmpty() ? ("Driver " + d.getDriverId()) : fullName.trim();
                driverNames.put(d.getDriverId(), name);
            }
        }

        if (customDrivers != null) {
            for (CustomDriverDTO cd : customDrivers) {
                if (cd.getDriverId() != null && cd.getName() != null && !cd.getName().trim().isEmpty()) {
                    driverNames.put(cd.getDriverId(), cd.getName().trim());
                    seasonDriverIds.add(cd.getDriverId());
                }
            }
        }
        lookups.setDriverNames(driverNames);

        // D) constructorNames: BD + custom
        Map<Long, String> constructorNames = new HashMap<>();

        if (!seasonConstructorIds.isEmpty()) {
            Iterable<Constructor> constructors = constructorDao.findAllById(seasonConstructorIds);
            for (Constructor c : constructors) {
                String name = (c.getName() != null && !c.getName().trim().isEmpty())
                        ? c.getName().trim()
                        : ("Constructor " + c.getConstructorId());
                constructorNames.put(c.getConstructorId(), name);
            }
        }

        if (customConstructors != null) {
            for (CustomConstructorDTO cc : customConstructors) {
                if (cc.getConstructorId() != null && cc.getName() != null && !cc.getName().trim().isEmpty()) {
                    constructorNames.put(cc.getConstructorId(), cc.getName().trim());
                    seasonConstructorIds.add(cc.getConstructorId());
                }
            }
        }
        lookups.setConstructorNames(constructorNames);

        // E) seasonDrivers (para UI)
        List<SeasonDriverDTO> seasonDrivers = new ArrayList<>();

        // ✅ mapping final preferido: fallback -> real -> custom
        Map<Long, Long> finalMapping = new HashMap<>();
        finalMapping.putAll(fallbackDriverToConstructor);

        if (realDriverToConstructor != null) {
            finalMapping.putAll(realDriverToConstructor);
        }

        if (customDriverToConstructor != null) {
            finalMapping.putAll(customDriverToConstructor);
        }

        for (Long driverId : seasonDriverIds) {
            Long cid = finalMapping.get(driverId);

            String dName = driverNames.getOrDefault(driverId, "Driver " + driverId);
            String cName = (cid != null)
                    ? constructorNames.getOrDefault(cid, "Constructor " + cid)
                    : null;

            seasonDrivers.add(new SeasonDriverDTO(driverId, cid, dName, cName));
        }

        seasonDrivers.sort(Comparator.comparing(
                SeasonDriverDTO::getDriverName,
                String.CASE_INSENSITIVE_ORDER
        ));
        lookups.setSeasonDrivers(seasonDrivers);

        return lookups;
    }

    private Integer computeTotalRoundsForSeason(Integer season) {
        List<Race> allSeasonRaces = raceDao.findByYearOrderByRound(season);

        Integer max = 0;
        for (Race r : allSeasonRaces) {
            if (r.getRound() != null) max = Math.max(max, r.getRound());
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
