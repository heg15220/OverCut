package overcutdebate.rest.dtos;

import java.util.List;

public class RoomDetailDto {
    public Long id;
    public String scope;
    public String day;
    public String topic;
    public String status;
    public long participantsCount;
    public long secondsRemainingToJoin;
    public long secondsRemainingToPollEnd;

    public List<ParticipantDto> participants;

    public static class ParticipantDto {
        public Long userId;
        public String userName;
        public String pollAnswer; // YES/NO/null
    }
}
