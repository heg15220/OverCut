package es.udc.fic.tfg.rest.dtos;

import java.util.List;

public class QuestionAI {

    private String question;
    private List<String> answers;
    private String correctAnswer;
    private int knowledgeLevel; // <-- AÑADIR ESTE CAMPO

    public QuestionAI() {}

    public QuestionAI(String question, List<String> answers, String correctAnswer, int knowledgeLevel) {
        this.question = question;
        this.answers = answers;
        this.correctAnswer = correctAnswer;
        this.knowledgeLevel = knowledgeLevel;
    }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public List<String> getAnswers() { return answers; }
    public void setAnswers(List<String> answers) { this.answers = answers; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public int getKnowledgeLevel() { return knowledgeLevel; }
    public void setKnowledgeLevel(int knowledgeLevel) { this.knowledgeLevel = knowledgeLevel; }
}
