package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class PostBlock {

    private Long id;

    private PostSection section;

    private String type; // text, image, tweet

    private String content;

    private byte[] image;

    private Integer blockOrder;

    private String caption;


    public PostBlock() {
    }

    public PostBlock(PostSection section, String type, String content, byte[] image, Integer blockOrder) {
        this.section = section;
        this.type = type;
        this.content = content;
        this.image = image;
        this.blockOrder = blockOrder;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sectionId", nullable = false)
    public PostSection getSection() {
        return section;
    }

    public void setSection(PostSection section) {
        this.section = section;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    @Lob
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }


    @Lob
    public byte[] getImage() {
        return image;
    }

    public void setImage(byte[] image) {
        this.image = image;
    }

    public Integer getBlockOrder() {
        return blockOrder;
    }

    public void setBlockOrder(Integer blockOrder) {
        this.blockOrder = blockOrder;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }
}
