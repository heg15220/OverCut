package overcut.rest.dtos;

public class BingoCellDto {

    private Long id;
    private int cellIndex;
    private String code;
    private String description;
    private String image; // puede ser null (ej: "Benetton.svg")

    public BingoCellDto() {}

    public BingoCellDto(Long id, int cellIndex, String code, String description, String image) {
        this.id = id;
        this.cellIndex = cellIndex;
        this.code = code;
        this.description = description;
        this.image = image;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getCellIndex() { return cellIndex; }
    public void setCellIndex(int cellIndex) { this.cellIndex = cellIndex; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}
