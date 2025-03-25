package es.udc.fic.tfg.rest.dtos;

// DTO de salida
public class ValidationResponse {
    private String correctAnswer;

    public ValidationResponse(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }
}

