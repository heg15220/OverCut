package es.udc.fic.tfg.rest.dtos;

import java.util.List;

public class QuestionWithAnswersDto {
    private QuestionDto question;
    private List<AnswerDto> answers;

    public QuestionWithAnswersDto(){

    }

    public QuestionWithAnswersDto(QuestionDto question, List<AnswerDto> answers) {
        this.question = question;
        this.answers = answers;
    }

    public QuestionDto getQuestion() {
        return question;
    }

    public void setQuestion(QuestionDto question) {
        this.question = question;
    }

    public List<AnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerDto> answers) {
        this.answers = answers;
    }
}
