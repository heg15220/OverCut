package overcut.rest.dtos;


public class DriverSeasonRoundDto {
    public Integer raceId;
    public Integer roundNumber;
    public String country;
    public String raceNameEn;
    public String raceNameEs;

    public Integer userGuess;
    public Boolean isCorrect;

    // Solo si revealed = true (o si quieres revelar al acertar, puedes usarlo)
    public Integer correctPosition;
}
