package es.udc.fic.tfg.rest.dtos;


public class TeamGuessClueDto {

    private Long id;
    private String driverName;
    private int clueOrder;

    public TeamGuessClueDto() {}

    public TeamGuessClueDto(Long id, String driverName, int clueOrder) {
        this.id = id;
        this.driverName = driverName;
        this.clueOrder = clueOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public int getClueOrder() { return clueOrder; }
    public void setClueOrder(int clueOrder) { this.clueOrder = clueOrder; }
}

