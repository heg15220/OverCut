package overcut.rest.dtos;


import java.util.List;

public class DriversConnectionsCategoryDto {
    private Long id;
    private String code;
    private String description;
    private List<DriversConnectionsPilotDto> pilots;

    public DriversConnectionsCategoryDto() {}

    public DriversConnectionsCategoryDto(Long id, String code, String description, List<DriversConnectionsPilotDto> pilots) {
        this.id = id;
        this.code = code;
        this.description = description;
        this.pilots = pilots;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<DriversConnectionsPilotDto> getPilots() {
        return pilots;
    }

    public void setPilots(List<DriversConnectionsPilotDto> pilots) {
        this.pilots = pilots;
    }
}

