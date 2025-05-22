package overcut.rest.dtos;

public class DriversLinkClueDto {

    private Long id;
    private String teammateName;
    private int clueOrder;

    public DriversLinkClueDto() {}

    public DriversLinkClueDto(Long id, String teammateName, int clueOrder) {
        this.id = id;
        this.teammateName = teammateName;
        this.clueOrder = clueOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeammateName() {
        return teammateName;
    }

    public void setTeammateName(String teammateName) {
        this.teammateName = teammateName;
    }

    public int getClueOrder() {
        return clueOrder;
    }

    public void setClueOrder(int clueOrder) {
        this.clueOrder = clueOrder;
    }
}
