package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;


import java.util.List;

/**
 * The Class Question.
 */
@Entity
public class Question {
    private Long id;
    private String name;

    /** The image. */

    @Lob
    private byte[] imagePath;

    private int knowledgequestionlevel;


    private List<QuizQuestions> quizQuestions;
    private List<Answer> answers;

    private List<UserAnswer> userAnswers;

    public Question() {
    }

    public Question(String name, byte[] imagePath, int knowledgequestionlevel) {
        this.name = name;
        this.imagePath = imagePath;
        this.knowledgequestionlevel = knowledgequestionlevel;
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
     * Gets the name.
     *
     * @return the name
     */
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the question image.
     *
     * @return the image
     */
    public byte[] getImagePath() {
        return imagePath;
    }

    public void setImagePath(byte[] imagePath) {
        this.imagePath = imagePath;
    }

    public int getKnowledgequestionlevel() {
        return knowledgequestionlevel;
    }

    public void setKnowledgequestionlevel(int knowledgequestionlevel) {
        this.knowledgequestionlevel = knowledgequestionlevel;
    }

    @OneToMany(mappedBy = "question")
    public List<QuizQuestions> getQuizQuestions() {
        return quizQuestions;
    }

    public void setQuizQuestions(List<QuizQuestions> quizQuestions) {
        this.quizQuestions = quizQuestions;
    }

    /**
     * Gets the quiz.
     *
     * @return the quiz
     */



    @OneToMany(mappedBy = "question")
    public List<Answer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<Answer> answers) {
        this.answers = answers;
    }

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL)
    public List<UserAnswer> getUserAnswers() {
        return userAnswers;
    }

    public void setUserAnswers(List<UserAnswer> userAnswers) {
        this.userAnswers = userAnswers;
    }
}
