package es.udc.fic.tfg.rest.dtos;

public class CareerPathClueDto {

    private Long id;
    private String teamName;
    private int clueOrder;

    public CareerPathClueDto() {}

    public CareerPathClueDto(Long id, String teamName, int clueOrder) {
        this.id = id;
        this.teamName = teamName;
        this.clueOrder = clueOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public int getClueOrder() {
        return clueOrder;
    }

    public void setClueOrder(int clueOrder) {
        this.clueOrder = clueOrder;
    }
}
