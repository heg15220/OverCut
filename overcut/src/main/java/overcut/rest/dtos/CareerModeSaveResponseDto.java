package overcut.rest.dtos;

import com.fasterxml.jackson.databind.JsonNode;

public class CareerModeSaveResponseDto {

    private String code;
    private JsonNode state;

    public CareerModeSaveResponseDto() {
    }

    public CareerModeSaveResponseDto(String code, JsonNode state) {
        this.code = code;
        this.state = state;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public JsonNode getState() {
        return state;
    }

    public void setState(JsonNode state) {
        this.state = state;
    }
}
