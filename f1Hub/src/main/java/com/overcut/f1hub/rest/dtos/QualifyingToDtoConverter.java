package com.overcut.f1hub.rest.dtos;

import com.overcut.f1hub.model.entities.Qualifying;
import org.springframework.stereotype.Component;

@Component
public class QualifyingToDtoConverter {

    public QualifyingResultDTO convert(Qualifying q) {
        var driver = q.getDriver();
        var constructor = q.getConstructor();

        return new QualifyingResultDTO(
                q.getPosition(),
                driver.getForename() + " " + driver.getSurname(),
                driver.getNationality(),
                constructor.getName(),
                q.getQ1(),
                q.getQ2(),
                q.getQ3(),
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
