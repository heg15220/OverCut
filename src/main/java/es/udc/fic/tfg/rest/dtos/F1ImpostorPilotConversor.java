package es.udc.fic.tfg.rest.dtos;


import es.udc.fic.tfg.model.entities.F1ImpostorPilot;

public class F1ImpostorPilotConversor {

    public static F1ImpostorPilotDto toDto(F1ImpostorPilot pilot) {
        return new F1ImpostorPilotDto(
                pilot.getPilotName(),
                pilot.isValid(),
                pilot.isSelectedByUser()
        );
    }
}
