package com.overcut.f1hub.rest.dtos;

import com.overcut.f1hub.model.entities.Result;
import org.springframework.stereotype.Component;

@Component
public class ResultToRaceResultDtoConverter {
    public RaceResultDTO convert(Result result) {
        var driver = result.getDriver();
        var constructor = result.getConstructor();
        var status = result.getStatus();

        return new RaceResultDTO(
                result.getPositionOrder(),
                driver.getForename() + " " + driver.getSurname(),
                driver.getNationality(),
                constructor.getName(),
                result.getNumber(),
                result.getGrid(),
                result.getLaps(),
                result.getTime(),
                result.getPoints(),
                status.getStatus(),
                getTeamColor(constructor.getConstructorRef()),
                getFlagUrl(driver.getNationality())
        );
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


    private String getFlagUrl(String nationality) {
        return "https://flagsapi.com/" + nationality.replace(" ", "_") + "/flat/24.png";
    }
}