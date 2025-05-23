package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.Result;
import com.overcut.f1hub.model.entities.ResultDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RaceResultServiceImpl implements RaceResultService {

    @Autowired
    private ResultDao resultRepository;


    @Override
    public List<Result> getRaceResults(Long raceId) {
        return resultRepository.findByRaceRaceIdOrderByPositionOrderAsc(raceId);
    }
}