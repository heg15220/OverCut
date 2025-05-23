package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.Result;

import java.util.List;

public interface RaceResultService {
    List<Result> getRaceResults(Long raceId);
}