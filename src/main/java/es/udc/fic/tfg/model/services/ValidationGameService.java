package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.TikiTakaGame;

public interface ValidationGameService {

    public boolean validatePilot(String rowCriteria, String columnCriteria, String piloto);

}
