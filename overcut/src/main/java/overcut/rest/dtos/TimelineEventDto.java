package overcut.rest.dtos;

public class TimelineEventDto {
    private Long id;
    private String code;
    private String text;
    private Integer hintYear;

    public TimelineEventDto() {}

    public TimelineEventDto(Long id, String code, String text, Integer hintYear) {
        this.id = id;
        this.code = code;
        this.text = text;
        this.hintYear = hintYear;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Integer getHintYear() { return hintYear; }
    public void setHintYear(Integer hintYear) { this.hintYear = hintYear; }
}
