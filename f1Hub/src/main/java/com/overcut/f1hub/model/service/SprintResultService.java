package com.overcut.f1hub.model.service;

import com.overcut.f1hub.model.entities.SprintResult;

import java.util.List;

public interface SprintResultService {
    List<SprintResult> getSprintResults(Long raceId);
}
