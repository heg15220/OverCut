package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.QualifyingDao;
import com.overcut.f1hub.model.entities.RaceDao;
import com.overcut.f1hub.model.entities.Result;
import com.overcut.f1hub.model.entities.ResultDao;
import com.overcut.f1hub.rest.dtos.GrandPrixDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RaceResultServiceImpl implements RaceResultService {

    @Autowired
    private ResultDao resultRepository;

    @Autowired
    private RaceDao raceDao;

    @Autowired
    private QualifyingDao qualifyingDao;

    @Override
    public List<Result> getRaceResults(Long raceId) {
        return resultRepository.findByRaceRaceIdOrderByPositionOrderAsc(raceId);
    }

    @Override
    public List<Integer> getAvailableYears() {
        return raceDao.findAllDistinctYears();
    }

    @Override
    public List<GrandPrixDTO> getGrandsPrixByYear(int year) {
        return raceDao.findByYearOrderByRoundAsc(year)
                .stream()
                .map(r -> new GrandPrixDTO(
                        r.getRaceId(),
                        r.getName(),
                        r.getRound(),
                        r.getCircuit() != null ? r.getCircuit().getName() : "Desconocido",
                        r.getCircuit() != null ? r.getCircuit().getCountry() : "Desconocido"
                ))
                .collect(Collectors.toList());
    }


    public List<String> getSessionsForRace( Long raceId) {
        var race = raceDao.findById(raceId).orElseThrow();
        List<String> sessions = new ArrayList<>();
        if (race.getFp1Date() != null) sessions.add("FP1");
        if (race.getFp2Date() != null) sessions.add("FP2");
        if (race.getFp3Date() != null) sessions.add("FP3");
        if (qualifyingDao.existsByRaceRaceId(raceId)) sessions.add("QUALI");
        if (race.getSprintDate() != null) sessions.add("SPRINT");
        sessions.add("RACE"); // Siempre disponible
        return sessions;
    }
}