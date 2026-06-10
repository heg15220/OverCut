package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.QualifyingDao;
import com.overcut.f1hub.model.entities.RaceDao;
import com.overcut.f1hub.model.entities.Result;
import com.overcut.f1hub.model.entities.ResultDao;
import com.overcut.f1hub.rest.dtos.GrandPrixDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RaceResultServiceImpl implements RaceResultService {

    @Autowired
    private ResultDao resultRepository;

    @Autowired
    private RaceDao raceDao;

    @Autowired
    private QualifyingDao qualifyingDao;

    @Override
    public List<Result> getRaceResults(Long raceId) {
        return resultRepository.findByRaceRaceIdOrderByPositionOrderAsc(raceId);
    }

    @Override
    public List<Integer> getAvailableYears() {
        return raceDao.findAllDistinctYears();
    }

    @Override
    public List<GrandPrixDTO> getGrandsPrixByYear(int year) {
        return raceDao.findByYearOrderByRoundAsc(year)
                .stream()
                .map(r -> {
                    var circuit = r.getCircuit();
                    String circuitName = circuit != null ? circuit.getName() : "Desconocido";
                    String circuitCountry = circuit != null ? circuit.getCountry() : "Desconocido";
                    String circuitCountryCode = getCountryCode(circuitCountry);
                    String gpAbbreviation = getGrandPrixAbbreviation(r.getName(), circuitCountry);

                    // Opción 1: constructor extendido con la abreviatura
                    GrandPrixDTO dto = new GrandPrixDTO(
                            r.getRaceId(),
                            r.getName(),
                            r.getRound(),
                            circuitName,
                            circuitCountry,
                            r.getYear(),
                            circuitCountryCode
                    );

                    // Opción 2: seteo aparte si agregas setGpAbbreviation()
                    dto.setGpAbbreviation(gpAbbreviation);
                    return dto;
                })
                .collect(Collectors.toList());
    }




    public List<String> getSessionsForRace( Long raceId) {
        var race = raceDao.findById(raceId).orElseThrow();
        List<String> sessions = new ArrayList<>();
        if (qualifyingDao.existsQualifyingForRace(raceId)) sessions.add("QUALI");
        if (race.getSprintDate() != null) sessions.add("SPRINT");
        sessions.add("RACE"); // Siempre disponible
        return sessions;
    }

    private String getCountryCode(String country) {
        if (country == null) return "xx";
        return switch (country.toLowerCase()) {
            case "argentina" -> "ar";
            case "australia" -> "au";
            case "austria" -> "at";
            case "azerbaijan" -> "az";
            case "bahrain" -> "bh";
            case "belgium" -> "be";
            case "brazil" -> "br";
            case "canada" -> "ca";
            case "china" -> "cn";
            case "france" -> "fr";
            case "germany" -> "de";
            case "hungary" -> "hu";
            case "india" -> "in";
            case "italy" -> "it";
            case "japan" -> "jp";
            case "korea" -> "kr";
            case "malaysia" -> "my";
            case "mexico" -> "mx";
            case "monaco" -> "mc";
            case "morocco" -> "ma";
            case "netherlands" -> "nl";
            case "portugal" -> "pt";
            case "qatar" -> "qa";
            case "russia" -> "ru";
            case "saudi arabia" -> "sa";
            case "singapore" -> "sg";
            case "south africa" -> "za";
            case "spain" -> "es";
            case "sweden" -> "se";
            case "switzerland" -> "ch";
            case "turkey" -> "tr";
            case "uae" -> "ae";
            case "uk" -> "gb";
            case "united kingdom" -> "gb";
            case "united states", "usa" -> "us";
            default -> "xx"; // fallback: not found
        };
    }

    private String getGrandPrixAbbreviation(String raceName, String country) {
        String name = normalizeText(raceName);

        if (name.contains("miami")) return "MIA";
        if (name.contains("madrid")) return "MAD";
        if (name.contains("barcelona-catalunya")) return "BCN";
        if (name.contains("las vegas")) return "LVG";
        if (name.contains("united states")) return "USA";
        if (name.contains("sao paulo")) return "SAO";
        if (name.contains("abu dhabi")) return "ABU";

        return getGrandPrixAbbreviation(country);
    }

    private String normalizeText(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
    }

    private String getGrandPrixAbbreviation(String country) {
        if (country == null) return "UNK";
        return switch (country.toLowerCase().trim()) {
            case "argentina"        -> "ARG";
            case "australia"        -> "AUS";
            case "austria"          -> "AUT";
            case "azerbaijan"       -> "AZE";
            case "bahrain"          -> "BHR";
            case "belgium"          -> "BEL";
            case "brazil"           -> "BRA";
            case "canada"           -> "CAN";
            case "china"            -> "CHN";
            case "france"           -> "FRA";
            case "germany"          -> "GER";
            case "hungary"          -> "HUN";
            case "india"            -> "IND";
            case "italy"            -> "ITA";
            case "japan"            -> "JPN";
            case "korea"            -> "KOR";
            case "malaysia"         -> "MYS";
            case "mexico"           -> "MEX";
            case "monaco"           -> "MON";
            case "morocco"          -> "MAR";
            case "netherlands"      -> "NED";
            case "portugal"         -> "POR";
            case "qatar"            -> "QAT";
            case "russia"           -> "RUS";
            case "saudi arabia"     -> "KSA";
            case "singapore"        -> "SIN";
            case "south africa"     -> "RSA";
            case "spain"            -> "ESP";
            case "sweden"           -> "SWE";
            case "switzerland"      -> "CHE";
            case "turkey"           -> "TUR";
            case "uae"              -> "UAE";
            case "uk", "united kingdom" -> "GBR";
            case "united states", "usa" -> "USA";
            default -> "UNK";
        };
    }


    @Override
    public GrandPrixDTO getRaceInfo(Long raceId) {
        var race = raceDao.findById(raceId).orElseThrow();
        var circuit = race.getCircuit();
        String circuitCountry = circuit != null ? circuit.getCountry() : "Desconocido";
        GrandPrixDTO dto = new GrandPrixDTO(
                race.getRaceId(),
                race.getName(),
                race.getRound(),
                circuit != null ? circuit.getName() : "Desconocido",
                circuitCountry,
                race.getYear(),
                getCountryCode(circuitCountry)
        );
        dto.setGpAbbreviation(getGrandPrixAbbreviation(race.getName(), circuitCountry));
        return dto;
    }
}
