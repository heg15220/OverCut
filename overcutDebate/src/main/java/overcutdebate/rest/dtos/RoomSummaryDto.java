package overcutdebate.rest.dtos;

public class RoomSummaryDto {
    public Long id;
    public String scope;
    public String topic;
    public String status;
    public long participantsCount;
    public long secondsRemainingToJoin;
    public long secondsRemainingToPollEnd;
}
