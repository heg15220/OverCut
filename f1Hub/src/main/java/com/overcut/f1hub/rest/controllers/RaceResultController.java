package com.overcut.f1hub.rest.controllers;

import com.overcut.f1hub.model.entities.Result;
import com.overcut.f1hub.model.service.QualifyingResultService;
import com.overcut.f1hub.model.service.RaceResultService;
import com.overcut.f1hub.model.service.SprintResultService;
import com.overcut.f1hub.rest.dtos.*;
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

    @Autowired
    private QualifyingResultService qualifyingResultService;

    @Autowired
    private QualifyingToDtoConverter qualifyingToDtoConverter;

    @Autowired
    private SprintResultService sprintResultService;

    @Autowired
    private SprintToDtoConverter sprintToDtoConverter;


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
    @GetMapping("/years")
    public List<Integer> getAvailableYears() {
        return raceResultService.getAvailableYears();
    }

    @GetMapping("/year/{year}/grands-prix")
    public List<GrandPrixDTO> getGrandsPrixByYear(@PathVariable int year) {
        return raceResultService.getGrandsPrixByYear(year);
    }

    @GetMapping("/race/{raceId}/sessions")
    public List<String> getSessionsForRace(@PathVariable Long raceId) {
        return raceResultService.getSessionsForRace(raceId);
    }


    @GetMapping("/{raceId}/qualifying")
    public List<QualifyingResultDTO> getQualifyingResults(@PathVariable Long raceId) {
        return qualifyingResultService.getQualifyingResults(raceId).stream()
                .map(qualifyingToDtoConverter::convert)
                .toList();
    }

    @GetMapping("/{raceId}/sprint")
    public List<SprintResultDTO> getSprintResults(@PathVariable Long raceId) {
        return sprintResultService.getSprintResults(raceId).stream()
                .map(sprintToDtoConverter::convert)
                .toList();
    }


    @GetMapping("/race/{raceId}/info")
    public GrandPrixDTO getRaceInfo(@PathVariable Long raceId) {
        return raceResultService.getRaceInfo(raceId);
    }



}