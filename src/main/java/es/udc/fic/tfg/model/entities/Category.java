package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

/**
 * The Class Category.
 */
@Entity
public class Category {

    private Long id;

    private String name;

    @Column(name = "historic")
    private boolean isHistoric;

    @Column(name = "quiz")
    private boolean isQuiz;


    public Category(){

    }


    public Category(String name, boolean isHistoric, boolean isQuiz) {
        this.name = name;
        this.isHistoric = isHistoric;
        this.isQuiz = isQuiz;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isHistoric() {
        return isHistoric;
    }

    public void setHistoric(boolean historic) {
        isHistoric = historic;
    }

    public boolean isQuiz() {
        return isQuiz;
    }

    public void setQuiz(boolean quiz) {
        isQuiz = quiz;
    }


}
