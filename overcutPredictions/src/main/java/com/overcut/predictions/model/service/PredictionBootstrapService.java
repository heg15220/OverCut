package com.overcut.predictions.model.service;

import com.overcut.predictions.model.dao.RaceDao;
import com.overcut.predictions.model.dao.ResultDao;
import com.overcut.predictions.model.dto.*;
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

    public PredictionBootstrapService(
            RaceDao raceDao,
            ResultDao resultDao
    ) {
        this.raceDao = raceDao;
        this.resultDao = resultDao;
    }

    /**
     * Bootstraps a season until (fromRound - 1),
     * returning real races and standings.
     */
    @Transactional
    public PredictionBootstrapDTO bootstrapSeason(
            Integer season,
            Integer fromRound
    ) {

        List<Race> races =
                raceDao.findByYearAndRoundLessThanOrderByRound(
                        season,
                        fromRound
                );

        PointsSystem pointsSystem =
                PointsSystemFactory.forSeason(season);

        Map<Long, Integer> driverPoints = new HashMap<>();
        Map<Long, Integer> constructorPoints = new HashMap<>();

        List<PredictionRaceDTO> raceDTOs = new ArrayList<>();

        for (Race race : races) {

            List<Result> results =
                    resultDao.findByRaceId(race.getRaceId());

            PredictionRaceDTO raceDTO = new PredictionRaceDTO();
            raceDTO.setRaceId(race.getRaceId());
            raceDTO.setRound(race.getRound());
            raceDTO.setRaceName(race.getName());

            List<PredictionResultDTO> resultDTOs =
                    new ArrayList<>();

            for (Result result : results) {

                int pts;

                if (season >= 2010) {
                    // Trust DB points for modern seasons
                    pts = result.getPoints();
                } else {
                    // Recalculate for historical seasons
                    pts = pointsSystem.pointsForPosition(
                            result.getPosition()
                    );
                }

                PredictionResultDTO r = new PredictionResultDTO();
                r.setDriverId(result.getDriverId());
                r.setConstructorId(result.getConstructorId());
                r.setPosition(result.getPosition());
                r.setPoints(pts);

                resultDTOs.add(r);

                driverPoints.merge(
                        result.getDriverId(),
                        pts,
                        Integer::sum
                );

                constructorPoints.merge(
                        result.getConstructorId(),
                        pts,
                        Integer::sum
                );
            }

            raceDTO.setResults(resultDTOs);
            raceDTOs.add(raceDTO);
        }

        PredictionBootstrapDTO dto =
                new PredictionBootstrapDTO();

        dto.setSeason(season);
        dto.setSimulatedFromRound(fromRound);
        dto.setCompletedRaces(raceDTOs);
        dto.setDriverStandings(
                buildStandings(driverPoints)
        );
        dto.setConstructorStandings(
                buildStandings(constructorPoints)
        );

        return dto;
    }

    private List<StandingsEntryDTO> buildStandings(
            Map<Long, Integer> pointsMap
    ) {
        List<StandingsEntryDTO> list =
                new ArrayList<>();

        for (Map.Entry<Long, Integer> e : pointsMap.entrySet()) {
            list.add(
                    new StandingsEntryDTO(
                            e.getKey(),
                            e.getValue()
                    )
            );
        }

        list.sort(
                (a, b) -> b.getPoints().compareTo(a.getPoints())
        );

        return list;
    }
}
