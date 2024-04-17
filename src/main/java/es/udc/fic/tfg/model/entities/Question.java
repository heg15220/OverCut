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
    @Column(name = "image_path")
    @Lob
    private byte[] imagePath;

    private Quiz quiz;

    private List<Answer> answers;

    public Question() {
    }

    public Question(String name, byte[] imagePath, Quiz quiz) {
        this.name = name;
        this.imagePath = imagePath;
        this.quiz = quiz;
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

    /**
     * Gets the quiz.
     *
     * @return the quiz
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "quizId")
    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    @OneToMany(mappedBy = "question")
    public List<Answer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<Answer> answers) {
        this.answers = answers;
    }
}
