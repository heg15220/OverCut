package overcut.rest.dtos;

import java.time.LocalDate;

public class TimelineEventRevealDto {
    private Long id;
    private String code;
    private String text;
    private Integer hintYear;
    private LocalDate date; // 👈 SOLO cuando se revela

    public TimelineEventRevealDto() {}

    public TimelineEventRevealDto(Long id, String code, String text, Integer hintYear, LocalDate date) {
        this.id = id;
        this.code = code;
        this.text = text;
        this.hintYear = hintYear;
        this.date = date;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Integer getHintYear() { return hintYear; }
    public void setHintYear(Integer hintYear) { this.hintYear = hintYear; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
