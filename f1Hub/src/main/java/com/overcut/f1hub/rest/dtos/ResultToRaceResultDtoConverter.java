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
            default -> "#aaaaaa";
        };
    }

    private String getFlagUrl(String nationality) {
        return "https://flagsapi.com/" + nationality.replace(" ", "_") + "/flat/24.png";
    }
}