package es.udc.fic.tfg.rest.dtos;

import java.sql.Timestamp;
import java.util.List;

public class RondoGameDto {

    private Long id;
    private Timestamp startTime;
    private Timestamp endTime;
    private Integer score;
    private String status;
    private String language;
    private List<RondoLetterDto> letters;

    // Getters, setters, constructor completo
    public RondoGameDto(Long id, Timestamp startTime, Timestamp endTime, Integer score, String status, String language, List<RondoLetterDto> letters) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.score = score;
        this.status = status;
        this.language = language;
        this.letters = letters;
    }

    public Long getId() { return id; }
    public Timestamp getStartTime() { return startTime; }
    public Timestamp getEndTime() { return endTime; }
    public Integer getScore() { return score; }
    public String getStatus() { return status; }
    public String getLanguage() { return language; }
    public List<RondoLetterDto> getLetters() { return letters; }
}
