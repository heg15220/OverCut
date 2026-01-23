package overcut.rest.dtos;

import java.util.List;

public class DriverSeasonGameDto {
    public Long gameId;
    public Integer seasonYear;
    public Integer maxPosition;

    public String driverName; // null hasta reveal
    public boolean revealed;
    public boolean completed;

    public List<DriverSeasonRoundDto> rounds;
}
