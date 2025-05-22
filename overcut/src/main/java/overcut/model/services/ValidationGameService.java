package overcut.model.services;

public interface ValidationGameService {

    public boolean validatePilot(Long gameId, String rowCriteria, String columnCriteria, String piloto);

}
