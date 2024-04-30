package es.udc.fic.tfg.rest.dtos;

public class AwardDto {

    private Long id;

    private String prize;

    private int requiredPoints;

    private Long userId;

    public AwardDto(Long id, String prize, int requiredPoints, Long userId) {
        this.id = id;
        this.prize = prize;
        this.requiredPoints = requiredPoints;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPrize() {
        return prize;
    }

    public void setPrize(String prize) {
        this.prize = prize;
    }

    public int getRequiredPoints() {
        return requiredPoints;
    }

    public void setRequiredPoints(int requiredPoints) {
        this.requiredPoints = requiredPoints;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
