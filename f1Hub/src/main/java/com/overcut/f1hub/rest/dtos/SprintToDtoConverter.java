package com.overcut.f1hub.rest.dtos;


import com.overcut.f1hub.model.entities.SprintResult;
import org.springframework.stereotype.Component;

@Component
public class SprintToDtoConverter {
    public SprintResultDTO convert(SprintResult result) {
        var driver = result.getDriver();
        var constructor = result.getConstructor();
        var status = result.getStatus();

        return new SprintResultDTO(
                result.getPosition() != null ? result.getPosition() : -1, // Protección
                driver.getForename() + " " + driver.getSurname(),
                driver.getNationality(),
                constructor.getName(),
                result.getGrid() != null ? result.getGrid() : 0,
                result.getLaps() != null ? result.getLaps() : 0,
                result.getTime(),
                result.getPoints() != null ? result.getPoints() : 0.0,
                status != null ? status.getStatus() : "Desconocido",
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
