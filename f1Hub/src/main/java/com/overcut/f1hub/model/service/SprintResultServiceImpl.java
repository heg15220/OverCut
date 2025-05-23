package com.overcut.f1hub.model.service;

import com.overcut.f1hub.model.entities.SprintResult;
import com.overcut.f1hub.model.entities.SprintResultDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SprintResultServiceImpl implements SprintResultService {

    @Autowired
    private SprintResultDao sprintResultDao;

    @Override
    public List<SprintResult> getSprintResults(Long raceId) {
        return sprintResultDao.findByRaceRaceIdOrderByPositionOrderAsc(raceId);
    }
}

