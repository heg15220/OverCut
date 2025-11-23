package overcut.model.entities;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true) // ignora cualquier campo extra que no mapeemos
public class GpQuestionTemplate {

    // Acepta q_es, q_en o question
    @JsonAlias({"q_es", "q_en", "question"})
    private String question;

    // Acepta answers_es, answers_en o answers
    @JsonAlias({"answers_es", "answers_en", "answers"})
    private List<String> answers;

    // Acepta correct_es, correct_en o correctAnswer
    @JsonAlias({"correct_es", "correct_en", "correctAnswer"})
    private String correctAnswer;

    // Por si en el JSON viene como "knowledgeLevel" o "knowledge_level"
    @JsonAlias({"knowledgeLevel", "knowledge_level"})
    private int knowledgeLevel;

    @JsonAlias({"category"})
    private String category;

    @JsonAlias({"language"})
    private String language;

    @JsonAlias({"sectionTitle", "section_title"})
    private String sectionTitle; // opcional

    // Getters y setters

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<String> getAnswers() {
        return answers;
    }

    public void setAnswers(List<String> answers) {
        this.answers = answers;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public int getKnowledgeLevel() {
        return knowledgeLevel;
    }

    public void setKnowledgeLevel(int knowledgeLevel) {
        this.knowledgeLevel = knowledgeLevel;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getSectionTitle() {
        return sectionTitle;
    }

    public void setSectionTitle(String sectionTitle) {
        this.sectionTitle = sectionTitle;
    }
}
