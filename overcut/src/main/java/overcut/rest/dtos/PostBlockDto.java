package overcut.rest.dtos;

public class PostBlockDto {
    private String type;
    private String content;
    private String image; // Base64
    private Integer blockOrder;

    public PostBlockDto() {
    }

    public PostBlockDto(String type, String content, String image, Integer blockOrder) {
        this.type = type;
        this.content = content;
        this.image = image;
        this.blockOrder = blockOrder;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Integer getBlockOrder() {
        return blockOrder;
    }

    public void setBlockOrder(Integer blockOrder) {
        this.blockOrder = blockOrder;
    }
}
