package es.udc.fic.tfg.model.services.exceptions;

public class CategoryGameGenerationException extends RuntimeException {

    private final String code;
    private final String data;

    public CategoryGameGenerationException(String code, String data) {
        super(code + ":" + data);
        this.code = code;
        this.data = data;
    }

    public String getCode() { return code; }
    public String getData() { return data; }
}