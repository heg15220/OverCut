package es.udc.fic.tfg.rest.dtos;

public class CheckWordRequest {
    private String userInput;
    private String language;

    public String getUserInput() {
        return userInput;
    }

    public void setUserInput(String userInput) {
        this.userInput = userInput;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
