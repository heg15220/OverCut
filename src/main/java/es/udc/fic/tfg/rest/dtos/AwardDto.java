package es.udc.fic.tfg.rest.dtos;

public class AwardDto {

    private Long id;

    private String award;

    private int requiredPoints;

    private String image;

    private Long userId;

    public AwardDto(Long id, String award, int requiredPoints, String image, Long userId) {
        this.id = id;
        this.award = award;
        this.requiredPoints = requiredPoints;
        this.image= image;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAward() {
        return award;
    }

    public void setAward(String award) {
        this.award = award;
    }

    public int getRequiredPoints() {
        return requiredPoints;
    }

    public void setRequiredPoints(int requiredPoints) {
        this.requiredPoints = requiredPoints;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
