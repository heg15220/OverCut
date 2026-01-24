package overcut.rest.dtos;

import java.util.List;

public class ValidateTimelineRequestDto {
    private Long gameId;
    private List<Long> orderedEventIds;

    public ValidateTimelineRequestDto() {}

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public List<Long> getOrderedEventIds() { return orderedEventIds; }
    public void setOrderedEventIds(List<Long> orderedEventIds) { this.orderedEventIds = orderedEventIds; }
}
