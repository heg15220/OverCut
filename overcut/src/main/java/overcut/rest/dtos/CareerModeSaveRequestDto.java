package overcut.rest.dtos;

import com.fasterxml.jackson.databind.JsonNode;

public class CareerModeSaveRequestDto {

    private String code;
    private JsonNode state;

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
