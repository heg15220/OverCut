package overcut.rest.dtos;

import overcut.model.entities.QuizCategoryCode;

import java.util.List;

public class QuestionAI {
    private String question;
    private List<String> answers;
    private String correctAnswer;
    private int knowledgeLevel;
    private QuizCategoryCode category; // Enum en lugar de String
    private String language;

    public QuestionAI() {}

    public QuestionAI(String question, List<String> answers, String correctAnswer, int knowledgeLevel, QuizCategoryCode category, String language) {
        this.question = question;
        this.answers = answers;
        this.correctAnswer = correctAnswer;
        this.knowledgeLevel = knowledgeLevel;
        this.category = category;
        this.language = language;
    }

    // Getters y Setters
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public List<String> getAnswers() { return answers; }
    public void setAnswers(List<String> answers) { this.answers = answers; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public int getKnowledgeLevel() { return knowledgeLevel; }
    public void setKnowledgeLevel(int knowledgeLevel) { this.knowledgeLevel = knowledgeLevel; }

    public QuizCategoryCode getCategory() { return category; }
    public void setCategory(QuizCategoryCode category) { this.category = category; }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
