package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * The Class Quiz.
 */
@Entity
public class Quiz {
    private Long id;

    @Column(name = "max_length")
    private int maxLength = 10;

    private LocalDateTime date;

    @Column(name= "knowledge_level")
    private String knowledgeLevel;

    private List<Question> questions;


    public Quiz() {
    }
    public Quiz(LocalDateTime date, String knowledgeLevel) {
        this.date = date;
        this.knowledgeLevel = knowledgeLevel;
    }

    /**
     * Gets the id.
     *
     * @return the id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the max_length.
     *
     * @return the max_length
     */

    public int getMaxLength() {
        return maxLength;
    }

    /**
     * Gets the quiz date.
     *
     * @return the date
     */
    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }


    /**
     * Gets the knowledge level of the user.
     *
     * @return the knowledge level
     */
    public String getKnowledgeLevel() {
        return knowledgeLevel;
    }

    public void setKnowledgeLevel(String knowledgeLevel) {
        this.knowledgeLevel = knowledgeLevel;
    }

    @OneToMany(mappedBy = "quiz")
    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public void setMaxLength(int maxLength) {
        this.maxLength = maxLength;
    }
}
