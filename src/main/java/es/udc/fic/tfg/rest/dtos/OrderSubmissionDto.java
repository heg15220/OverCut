package es.udc.fic.tfg.rest.dtos;

import java.util.List;

public class OrderSubmissionDto {
    private Long gameId;
    private List<Long> orderedDriverIds;

    public OrderSubmissionDto() {
    }

    public OrderSubmissionDto(Long gameId, List<Long> orderedDriverIds) {
        this.gameId = gameId;
        this.orderedDriverIds = orderedDriverIds;
    }

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public List<Long> getOrderedDriverIds() { return orderedDriverIds; }
    public void setOrderedDriverIds(List<Long> orderedDriverIds) { this.orderedDriverIds = orderedDriverIds; }
}

