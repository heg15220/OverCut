package com.overcut.f1hub.model.service;


import com.overcut.f1hub.model.entities.Race;
import com.overcut.f1hub.model.entities.RaceDao;
import com.overcut.f1hub.model.entities.Result;
import com.overcut.f1hub.model.entities.ResultDao;
import com.overcut.f1hub.model.entities.SprintResult;
import com.overcut.f1hub.model.entities.SprintResultDao;
import com.overcut.f1hub.rest.dtos.ChampionshipTrackingDTO;
import com.overcut.f1hub.rest.dtos.RoundPoints;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ChampionshipTrackingServiceImpl implements ChampionshipTrackingService {

    @Autowired
    private RaceDao raceDao;

    @Autowired
    private ResultDao resultDao;

    @Autowired
    private SprintResultDao sprintResultDao;

    @Override
    @Transactional
    public List<ChampionshipTrackingDTO> getChampionshipTracking(int year) {
        List<Race> races = raceDao.findByYearOrderByRoundAsc(year);

        // Mapa: driverId -> DTO
        Map<Long, ChampionshipTrackingDTO> driverMap = new LinkedHashMap<>();

        // Mapa auxiliar para sprint points
        Map<String, Double> sprintPoints = new HashMap<>();
        for (Race race : races) {
            List<SprintResult> sprints = sprintResultDao.findByRaceRaceIdOrderByPositionOrderAsc(race.getRaceId());
            for (SprintResult sr : sprints) {
                String key = sr.getDriver().getDriverId() + "-" + race.getRaceId();
                sprintPoints.put(key, sr.getPoints() != null ? sr.getPoints() : 0.0);
            }
        }

        for (Race race : races) {
            int round = race.getRound();
            long raceId = race.getRaceId();

            List<Result> results = resultDao.findByRaceRaceIdOrderByPositionOrderAsc(raceId);
            Set<Long> participatingDrivers = new HashSet<>();

            for (Result result : results) {
                Long driverId = result.getDriver().getDriverId();
                participatingDrivers.add(driverId);

                String driverName = result.getDriver().getForename() + " " + result.getDriver().getSurname();
                String nationality = result.getDriver().getNationality();
                String flagUrl = getFlagUrl(nationality);

                String statusText = result.getStatus().getStatus();
                String key = driverId + "-" + raceId;
                double racePoints = result.getPoints() != null ? result.getPoints() : 0.0;
                double sprintPts = sprintPoints.getOrDefault(key, 0.0);
                double total = racePoints + sprintPts;

                String value;
                if (statusText.toLowerCase().contains("ret") || statusText.toLowerCase().contains("accident")
                        || statusText.toLowerCase().contains("engine") || statusText.toLowerCase().contains("gearbox")) {
                    value = "DNF";
                } else {
                    value = total > 0 ? String.valueOf(total) : "0";
                }

                ChampionshipTrackingDTO dto = driverMap.get(driverId);
                if (dto == null) {
                    String countryCode = getCountryCodeFromNationality(nationality);
                    dto = new ChampionshipTrackingDTO(driverName, nationality, flagUrl, countryCode);

                    driverMap.put(driverId, dto);
                }
                dto.getRoundPoints().put(round, new RoundPoints(sprintPts, racePoints, value));
            }

            // Marcar DNS para pilotos que no están en la carrera
            for (ChampionshipTrackingDTO dto : driverMap.values()) {
                if (!dto.getRoundPoints().containsKey(round)) {
                    dto.getRoundPoints().put(round, new RoundPoints(0.0, 0.0, "DNS"));

                }
            }
        }

        List<ChampionshipTrackingDTO> sorted = driverMap.values().stream()
                .sorted((a, b) -> {
                    double pointsA = getTotalPoints(a.getRoundPoints());
                    double pointsB = getTotalPoints(b.getRoundPoints());
                    return Double.compare(pointsB, pointsA);
                })
                .toList();

        // Asignar posición final
        int position = 1;
        for (ChampionshipTrackingDTO dto : sorted) {
            dto.setFinalPosition(position++);
        }

        return sorted;

    }

    private double getTotalPoints(Map<Integer, RoundPoints> roundPoints) {
        return roundPoints.values().stream()
                .filter(rp -> !rp.getStatus().equals("DNF") && !rp.getStatus().equals("DNS"))
                .mapToDouble(rp -> rp.getSprintPoints() + rp.getRacePoints())
                .sum();
    }




    private String getFlagUrl(String nationality) {
        String code = switch (nationality.toLowerCase().trim()) {
            case "argentine", "argentinian" -> "AR";
            case "australian" -> "AU";
            case "austrian" -> "AT";
            case "belgian" -> "BE";
            case "brazilian" -> "BR";
            case "british" -> "GB";
            case "canadian" -> "CA";
            case "chilean" -> "CL";
            case "chinese" -> "CN";
            case "colombian" -> "CO";
            case "czech" -> "CZ";
            case "danish" -> "DK";
            case "dutch" -> "NL";
            case "east german", "german" -> "DE";
            case "finnish" -> "FI";
            case "french" -> "FR";
            case "hungarian" -> "HU";
            case "indian" -> "IN";
            case "indonesian" -> "ID";
            case "irish" -> "IE";
            case "italian" -> "IT";
            case "japanese" -> "JP";
            case "liechtensteiner" -> "LI";
            case "malaysian" -> "MY";
            case "mexican" -> "MX";
            case "monegasque" -> "MC";
            case "new zealander" -> "NZ";
            case "polish" -> "PL";
            case "portuguese" -> "PT";
            case "russian" -> "RU";
            case "south african" -> "ZA";
            case "spanish" -> "ES";
            case "swedish" -> "SE";
            case "swiss" -> "CH";
            case "thai" -> "TH";
            case "uruguayan" -> "UY";
            case "venezuelan" -> "VE";
            case "american", "american-italian" -> "US";
            default -> "XX";
        };
        return "https://flagsapi.com/" + code + "/flat/24.png";
    }

    private String getCountryCodeFromNationality(String nationality) {
        return switch (nationality.toLowerCase().trim()) {
            case "argentine", "argentinian" -> "AR";
            case "australian" -> "AU";
            case "austrian" -> "AT";
            case "belgian" -> "BE";
            case "brazilian" -> "BR";
            case "british" -> "GB";
            case "canadian" -> "CA";
            case "chilean" -> "CL";
            case "chinese" -> "CN";
            case "colombian" -> "CO";
            case "czech" -> "CZ";
            case "danish" -> "DK";
            case "dutch" -> "NL";
            case "east german", "german" -> "DE";
            case "finnish" -> "FI";
            case "french" -> "FR";
            case "hungarian" -> "HU";
            case "indian" -> "IN";
            case "indonesian" -> "ID";
            case "irish" -> "IE";
            case "italian" -> "IT";
            case "japanese" -> "JP";
            case "liechtensteiner" -> "LI";
            case "malaysian" -> "MY";
            case "mexican" -> "MX";
            case "monegasque" -> "MC";
            case "new zealander" -> "NZ";
            case "polish" -> "PL";
            case "portuguese" -> "PT";
            case "russian" -> "RU";
            case "south african" -> "ZA";
            case "spanish" -> "ES";
            case "swedish" -> "SE";
            case "swiss" -> "CH";
            case "thai" -> "TH";
            case "uruguayan" -> "UY";
            case "venezuelan" -> "VE";
            case "american", "american-italian" -> "US";
            default -> "XX";
        };
    }

}
