    package es.udc.fic.tfg.model.entities;
    
    import jakarta.persistence.*;
    
    import java.util.List;
    
    /**
     * The Class Answer.
     */
    @Entity
    public class Answer {
        private Long id;
        private String name;
        private boolean correct;
        private Question question;
        private List<UserAnswer> userAnswer;
    
        public Answer(){
    
        }
    
        public Answer(String name, boolean correct, Question question) {
            this.name = name;
            this.correct = correct;
            this.question = question;
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
         * Gets if the answer is correct or not.
         *
         * @return the boolean
         */
        public boolean isCorrect() {
            return correct;
        }
    
        public void setCorrect(boolean correct) {
            this.correct = correct;
        }
    
        /**
         * Gets the question for the answer.
         *
         * @return the question
         */
        @ManyToOne(optional = false, fetch = FetchType.LAZY)
        @JoinColumn(name = "questionId")
        public Question getQuestion() {
            return question;
        }
    
        public void setQuestion(Question question) {
            this.question = question;
        }
    
        @OneToMany(mappedBy = "answer")
        public List<UserAnswer> getUserAnswer() {
            return userAnswer;
        }
    
        public void setUserAnswer(List<UserAnswer> userAnswer) {
            this.userAnswer = userAnswer;
        }
    }
