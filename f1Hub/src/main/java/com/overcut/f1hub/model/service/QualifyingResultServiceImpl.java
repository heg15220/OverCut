package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.Qualifying;
import com.overcut.f1hub.model.entities.QualifyingDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QualifyingResultServiceImpl implements QualifyingResultService {

    @Autowired
    private QualifyingDao qualifyingDao;

    @Override
    public List<Qualifying> getQualifyingResults(Long raceId) {
        return qualifyingDao.findByRaceRaceIdOrderByPositionAsc(raceId);
    }
}
