package com.overcut.f1hub.model.service;

import com.overcut.f1hub.rest.dtos.ChampionshipTrackingDTO;

import java.util.List;

public interface ChampionshipTrackingService {
    List<ChampionshipTrackingDTO> getChampionshipTracking(int year);
}
