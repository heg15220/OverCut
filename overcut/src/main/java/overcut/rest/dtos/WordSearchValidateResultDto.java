package overcut.rest.dtos;

public class WordSearchValidateResultDto {
    private boolean valid;

    public WordSearchValidateResultDto() {}

    public WordSearchValidateResultDto(boolean valid) {
        this.valid = valid;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
}
