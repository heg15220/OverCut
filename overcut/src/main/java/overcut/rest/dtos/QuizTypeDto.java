package overcut.rest.dtos;

import overcut.model.entities.QuizTypeCode;

public class QuizTypeDto {
    private Long id;

    private QuizTypeCode code;

    private String imagePath;

    private String name;

    public QuizTypeDto() {
    }

    public QuizTypeDto(Long id, QuizTypeCode code, String imagePath) {
        this.id = id;
        this.code = code;
        this.imagePath = imagePath;
    }

    public QuizTypeDto(Long id, QuizTypeCode code, String imagePath, String name) {
        this.id = id;
        this.code = code;
        this.imagePath = imagePath;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public QuizTypeCode getCode() {
        return code;
    }

    public void setCode(QuizTypeCode code) {
        this.code = code;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

