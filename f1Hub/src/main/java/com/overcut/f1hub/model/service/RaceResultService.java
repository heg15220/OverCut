package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.Result;
import com.overcut.f1hub.rest.dtos.GrandPrixDTO;

import java.util.List;

public interface RaceResultService {
    List<Result> getRaceResults(Long raceId);
    List<Integer> getAvailableYears();
    List<GrandPrixDTO> getGrandsPrixByYear(int year);
    List<String> getSessionsForRace(Long raceId);
}