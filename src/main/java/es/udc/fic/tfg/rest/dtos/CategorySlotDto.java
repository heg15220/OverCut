package es.udc.fic.tfg.rest.dtos;


public class CategorySlotDto {
    private String category;
    private String answer;
    private Boolean valid;

    public CategorySlotDto() {}

    public CategorySlotDto(String category, String answer, Boolean valid) {
        this.category = category;
        this.answer = answer;
        this.valid = valid;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public Boolean getValid() { return valid; }
    public void setValid(Boolean valid) { this.valid = valid; }
}
