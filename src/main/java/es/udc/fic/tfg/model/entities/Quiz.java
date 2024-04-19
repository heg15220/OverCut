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
    private int knowledgeLevel;

    private Assessment assessment;
    private List<Question> questions;

    private List <UserAnswer> userAnswers;

    public Quiz() {
    }
    public Quiz(LocalDateTime date, int knowledgeLevel) {
        this.date = date;
        this.knowledgeLevel = knowledgeLevel;
    }

    public Quiz(LocalDateTime date, int knowledgeLevel,Assessment assessment) {
        this.date = date;
        this.knowledgeLevel = knowledgeLevel;
        this.assessment = assessment;
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
    public int getKnowledgeLevel() {
        return knowledgeLevel;
    }

    public void setKnowledgeLevel(int knowledgeLevel) {
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

    @OneToMany(mappedBy = "quiz")
    public List<UserAnswer> getUserAnswers() {
        return userAnswers;
    }

    public void setUserAnswers(List<UserAnswer> userAnswers) {
        this.userAnswers = userAnswers;
    }


    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "assessmentId")
    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }
}
