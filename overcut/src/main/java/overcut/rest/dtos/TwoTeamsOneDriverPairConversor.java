package overcut.rest.dtos;

import overcut.model.entities.TwoTeamsOneDriverPair;

public class TwoTeamsOneDriverPairConversor {

    public static TwoTeamsOneDriverPairDto toDto(TwoTeamsOneDriverPair pair) {
        TwoTeamsOneDriverPairDto dto = new TwoTeamsOneDriverPairDto();
        dto.setTeamA(pair.getTeamA());
        dto.setTeamB(pair.getTeamB());
        dto.setDriverName(pair.getGuessedDriverName());
        dto.setGuessedCorrectly(pair.getGuessedCorrectly());
        dto.setPairOrder(pair.getPairOrder());
        return dto;
    }
}

