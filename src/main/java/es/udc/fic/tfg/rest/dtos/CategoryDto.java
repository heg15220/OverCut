package es.udc.fic.tfg.rest.dtos;

public class CategoryDto {
    /** The category id. */
    private Long categoryId;

    /** The name. */
    private String name;

    private boolean isHistoric;

    private boolean isQuiz;

    public CategoryDto(Long categoryId, String name, boolean isHistoric, boolean isQuiz) {
        this.categoryId = categoryId;
        this.name = name;
        this.isHistoric = isHistoric;
        this.isQuiz = isQuiz;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
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
