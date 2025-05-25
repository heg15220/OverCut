package com.overcut.f1hub.model.service;


import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
import com.overcut.f1hub.rest.dtos.DriverRankingDTO;
import com.overcut.f1hub.rest.dtos.DriverStandingDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StatisticsServiceImpl implements StatisticsService {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<DriverStandingDTO> getDriverStandings(int year) {
        String sql = """
        SELECT d.driverId, d.forename, d.surname, d.nationality,
               c.constructorRef, c.name, SUM(p.points) AS totalPoints
        FROM (
            SELECT r.driverId, r.constructorId, r.points, r.raceId
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year = :year

            UNION ALL

            SELECT sr.driverId, sr.constructorId, sr.points, sr.raceId
            FROM sprintresults sr
            JOIN races ra ON sr.raceId = ra.raceId
            WHERE ra.year = :year
        ) p
        JOIN drivers d ON d.driverId = p.driverId
        JOIN constructors c ON c.constructorId = p.constructorId
        GROUP BY d.driverId, c.constructorId
        ORDER BY d.driverId, totalPoints DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("year", year);

        List<Object[]> rows = query.getResultList();
        List<DriverStandingDTO> result = new ArrayList<>();
        List<Long> includedDriverIds = new ArrayList<>();

        for (Object[] row : rows) {
            Long driverId = ((Number) row[0]).longValue();
            String forename = (String) row[1];
            String surname = (String) row[2];
            String nationality = (String) row[3];
            String constructorRef = (String) row[4];
            String constructorName = (String) row[5];
            double totalPoints = ((Number) row[6]).doubleValue();

            if (!includedDriverIds.contains(driverId)) {
                includedDriverIds.add(driverId);
                String fullName = forename + " " + surname;
                String flagUrl = getFlagUrl(nationality);
                String teamColor = getTeamColor(constructorRef);

                result.add(new DriverStandingDTO(
                        fullName,
                        nationality,
                        constructorName,
                        teamColor,
                        totalPoints,
                        flagUrl
                ));
            }
        }

        // Ordenar finalmente por puntos descendente
        result.sort((a, b) -> Double.compare(b.getTotalPoints(), a.getTotalPoints()));
        return result;
    }




    @Override
    public List<ConstructorStandingDTO> getConstructorStandings(int year) {
        String sql = """
        SELECT c.constructorRef, c.name, SUM(all_points.points) AS totalPoints
        FROM (
            SELECT r.constructorId, r.points
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year = :year

            UNION ALL

            SELECT sr.constructorId, sr.points
            FROM sprintresults sr
            JOIN races ra ON sr.raceId = ra.raceId
            WHERE ra.year = :year
        ) AS all_points
        JOIN constructors c ON all_points.constructorId = c.constructorId
        GROUP BY c.constructorId
        ORDER BY totalPoints DESC
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("year", year);

        List<Object[]> rows = query.getResultList();
        List<ConstructorStandingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String constructorRef = (String) row[0];
            String name = (String) row[1];
            double totalPoints = ((Number) row[2]).doubleValue();
            String teamColor = getTeamColor(constructorRef);

            result.add(new ConstructorStandingDTO(name, totalPoints, teamColor));
        }

        return result;
    }


    @Override
    public List<DriverRankingDTO> getDriverWinRanking() {
        String sql = """
                SELECT d.forename, d.surname, d.nationality, COUNT(*) AS wins
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1
                GROUP BY d.driverId
                ORDER BY wins DESC
                """;

        Query query = entityManager.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();
        List<DriverRankingDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String forename = (String) row[0];
            String surname = (String) row[1];
            String nationality = (String) row[2];
            int wins = ((Number) row[3]).intValue();
            String flagUrl = getFlagUrl(nationality);

            result.add(new DriverRankingDTO(forename + " " + surname, nationality, wins, flagUrl));
        }

        return result;
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
            case "rhodesian" -> "ZW"; // (histórico)
            case "russian" -> "RU";
            case "south african" -> "ZA";
            case "spanish" -> "ES";
            case "swedish" -> "SE";
            case "swiss" -> "CH";
            case "thai" -> "TH";
            case "uruguayan" -> "UY";
            case "venezuelan" -> "VE";
            case "american", "american-italian" -> "US";
            default -> "XX"; // Unknown
        };
        return "https://flagsapi.com/" + code + "/flat/24.png";
    }


    private String getTeamColor(String constructorRef) {
        return switch (constructorRef.toLowerCase()) {
            case "ferrari" -> "#dc0000";
            case "mercedes" -> "#00d2be";
            case "red_bull" -> "#1e41ff";
            case "rb" -> "#14394c";
            case "mclaren" -> "#ff8700";
            case "aston_martin" -> "#00665e";
            case "alpine" -> "#2293d1";
            case "williams" -> "#005aff";
            case "alpha_tauri", "alphatauri" -> "#2b4562";
            case "haas" -> "#b6babd";
            case "sauber", "stake", "alfa_romeo", "alfa" -> "#900000";
            case "renault" -> "#fff500";
            case "toro_rosso" -> "#0033a0";
            case "force_india" -> "#f596c8";
            case "lotus", "lotus_f1", "lotus_racing" -> "#027a36";
            case "caterham" -> "#004b33";
            case "manor", "marussia", "virgin" -> "#c70039";
            case "brawn" -> "#ffffff";
            case "jordan" -> "#ffd700";
            case "bmw_sauber", "bmw" -> "#1d1d5c";
            case "toyota" -> "#d40000";
            case "super_aguri" -> "#ed1c24";
            case "honda" -> "#d50000";
            case "spyker", "spyker_mf1" -> "#f75c03";
            case "mf1" -> "#999999";
            case "bar" -> "#00665e";
            case "minardi" -> "#3d3d3d";
            case "jaguar" -> "#007a3d";
            case "prost" -> "#0055a4";
            case "arrows" -> "#ff7f00";
            case "benetton" -> "#009878";
            case "stewart" -> "#004fa3";
            case "tyrrell" -> "#1a1aff";
            case "ligier" -> "#0000cc";
            case "forti" -> "#ffe600";
            case "footwork" -> "#e60000";
            case "pacific" -> "#0033cc";
            case "simtek" -> "#660066";
            case "team_lotus" -> "#003300";
            case "larrousse" -> "#000066";
            case "brabham" -> "#2b2bff";
            case "dallara" -> "#004b87";
            case "fondmetal" -> "#b22222";
            case "march" -> "#ee82ee";
            case "moda" -> "#ff6666";
            case "ags" -> "#ffcc00";
            case "lambo" -> "#00ff00";
            case "leyton" -> "#800000";
            case "coloni" -> "#999999";
            case "eurobrun" -> "#b03060";
            case "osella" -> "#0066cc";
            case "onyx" -> "#5e0080";
            case "life" -> "#7f0000";
            case "rial" -> "#0047ab";
            case "zakspeed" -> "#ff0000";
            case "ram" -> "#2f4f4f";
            case "spirit" -> "#1c1c1c";
            case "toleman" -> "#00008b";
            case "ats" -> "#ffcc00";
            case "theodore" -> "#c71585";
            case "fittipaldi" -> "#ffd700";
            case "ensign" -> "#000000";
            case "shadow" -> "#4b0082";
            case "wolf" -> "#000080";
            case "merzario" -> "#ffcccb";
            // Resto usarán gris por defecto
            default -> "#aaaaaa";
        };
    }
}
