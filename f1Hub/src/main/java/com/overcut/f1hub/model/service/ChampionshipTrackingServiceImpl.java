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
import java.util.stream.Collectors;

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
        List<SprintResult> allSprintResults = sprintResultDao.findByRaceYearWithDriver(year);
        Map<Long, List<SprintResult>> sprintResultsByRaceId = allSprintResults.stream()
                .collect(Collectors.groupingBy(sr -> sr.getRace().getRaceId()));

        Map<String, Double> sprintPoints = new HashMap<>();
        for (SprintResult sr : allSprintResults) {
            String key = sr.getDriver().getDriverId() + "-" + sr.getRace().getRaceId();
            sprintPoints.put(key, sr.getPoints() != null ? sr.getPoints() : 0.0);
        }


        List<Result> allResults = resultDao.findByRaceYearWithDriverAndStatus(year);
        Map<Long, List<Result>> resultsByRaceId = allResults.stream()
                .collect(Collectors.groupingBy(r -> r.getRace().getRaceId()));


        for (Race race : races) {
            int round = race.getRound();
            long raceId = race.getRaceId();

            // ✅ Ya NO llamas al DAO aquí
            List<Result> results = resultsByRaceId.getOrDefault(raceId, Collections.emptyList());
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

                // ✅ Estatus separado solo para la carrera
                String raceStatus = statusText.toLowerCase().contains("did not start") ? "DNS"
                        : statusText.toLowerCase().contains("not classified") ? "DNF"
                        : "OK";

                ChampionshipTrackingDTO dto = driverMap.get(driverId);
                if (dto == null) {
                    String countryCode = getCountryCodeFromNationality(nationality);
                    dto = new ChampionshipTrackingDTO(driverName, nationality, flagUrl, countryCode);
                    driverMap.put(driverId, dto);
                }

                int positionOrder = result.getPositionOrder() != null ? result.getPositionOrder() : 999;

                // ✅ Guardar status real, sprint y carrera por separado
                dto.getRoundPoints().put(round, new RoundPoints(sprintPts, racePoints, raceStatus, positionOrder));
            }

            // ✅ Marcar DNS para los que no participaron
            for (ChampionshipTrackingDTO dto : driverMap.values()) {
                if (!dto.getRoundPoints().containsKey(round)) {
                    dto.getRoundPoints().put(round, new RoundPoints(0.0, 0.0, "DNS", 999));
                }
            }
        }


        List<ChampionshipTrackingDTO> sorted = driverMap.values().stream()
                .sorted((a, b) -> {
                    int cmp = Double.compare(getTotalPoints(b.getRoundPoints()), getTotalPoints(a.getRoundPoints()));
                    if (cmp != 0) return cmp;

                    // Desempate por posiciones reales (1º, 2º, ..., 10º)
                    for (int pos = 1; pos <= 10; pos++) {
                        int countA = countRacePositions(a.getRoundPoints(), pos);
                        int countB = countRacePositions(b.getRoundPoints(), pos);
                        if (countA != countB) return Integer.compare(countB, countA);
                    }

                    return a.getDriverName().compareTo(b.getDriverName()); // último recurso
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
                .mapToDouble(rp -> {
                    double sprint = rp.getSprintPoints() != null ? rp.getSprintPoints() : 0.0;
                    double race = rp.getRacePoints() != null ? rp.getRacePoints() : 0.0;
                    return sprint + race;
                })
                .sum();
    }



    private int countRacePositions(Map<Integer, RoundPoints> roundPoints, int targetPosition) {
        return (int) roundPoints.values().stream()
                .filter(rp -> "OK".equals(rp.getStatus()))
                .filter(rp -> rp.getPositionOrder() == targetPosition)
                .count();
    }




    private int getPointsForPosition(int pos, int year) {
        if (year >= 2010) {
            return switch (pos) {
                case 1 -> 25;
                case 2 -> 18;
                case 3 -> 15;
                case 4 -> 12;
                case 5 -> 10;
                case 6 -> 8;
                case 7 -> 6;
                case 8 -> 4;
                case 9 -> 2;
                case 10 -> 1;
                default -> 0;
            };
        } else if (year >= 2003) {
            return switch (pos) {
                case 1 -> 10;
                case 2 -> 8;
                case 3 -> 6;
                case 4 -> 5;
                case 5 -> 4;
                case 6 -> 3;
                case 7 -> 2;
                case 8 -> 1;
                default -> 0;
            };
        } else if (year >= 1991) {
            return switch (pos) {
                case 1 -> 10;
                case 2 -> 6;
                case 3 -> 4;
                case 4 -> 3;
                case 5 -> 2;
                case 6 -> 1;
                default -> 0;
            };
        } else {
            return switch (pos) {
                case 1 -> 9;
                case 2 -> 6;
                case 3 -> 4;
                case 4 -> 3;
                case 5 -> 2;
                case 6 -> 1;
                default -> 0;
            };
        }
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
