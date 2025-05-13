package es.udc.fic.tfg.rest.dtos;

public class RondoLetterDto {
    private char letter;
    private String question;
    private String status;

    public RondoLetterDto(char letter, String question, String status) {
        this.letter = letter;
        this.question = question;
        this.status = status;
    }

    public char getLetter() { return letter; }
    public String getQuestion() { return question; }
    public String getStatus() { return status; }
}
