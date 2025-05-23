package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.Qualifying;

import java.util.List;

public interface QualifyingResultService {
    List<Qualifying> getQualifyingResults(Long raceId);
}
