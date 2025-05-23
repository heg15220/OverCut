package com.overcut.f1hub.rest.controllers;

import com.overcut.f1hub.model.entities.Result;
import com.overcut.f1hub.model.service.RaceResultService;
import com.overcut.f1hub.rest.dtos.RaceResultDTO;
import com.overcut.f1hub.rest.dtos.ResultToRaceResultDtoConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:8080")
@RestController
@RequestMapping("/api/races")
public class RaceResultController {

    @Autowired
    private RaceResultService raceResultService;

    @Autowired
    private ResultToRaceResultDtoConverter converter;

    public RaceResultController(RaceResultService raceResultService) {
        this.raceResultService = raceResultService;
    }

    @GetMapping("/{raceId}/results")
    public List<RaceResultDTO> getRaceResults(@PathVariable Long raceId) {
        List<Result> results = raceResultService.getRaceResults(raceId);
        List<RaceResultDTO> dtos = results.stream()
                .map(converter::convert)
                .collect(Collectors.toList());
        return dtos;
    }
}