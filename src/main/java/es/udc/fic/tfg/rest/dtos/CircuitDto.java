package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Category;
import jakarta.persistence.Lob;

public class CircuitDto {
    private Long id;
    private String name;

    private Long distance;

    private Long numberLaps;

    private String teamSuccess;

    @Lob
    private byte[] image;

    private Long categoryId;

    public CircuitDto(Long id, String name,Long distance, Long numberLaps, String teamSuccess, byte[] image, Long categoryId) {
        this.id = id;
        this.name = name;
        this.distance = distance;
        this.numberLaps = numberLaps;
        this.teamSuccess = teamSuccess;
        this.image = image;
        this.categoryId = categoryId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getDistance() {
        return distance;
    }

    public void setDistance(Long distance) {
        this.distance = distance;
    }

    public Long getNumberLaps() {
        return numberLaps;
    }

    public void setNumberLaps(Long numberLaps) {
        this.numberLaps = numberLaps;
    }

    public String getTeamSuccess() {
        return teamSuccess;
    }

    public void setTeamSuccess(String teamSuccess) {
        this.teamSuccess = teamSuccess;
    }

    public byte[] getImage() {
        return image;
    }

    public void setImage(byte[] image) {
        this.image = image;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }
}
