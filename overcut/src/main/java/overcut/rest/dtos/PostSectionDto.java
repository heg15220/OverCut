package overcut.rest.dtos;


import java.util.List;

public class PostSectionDto {

    private Long id;
    private String title;
    private Integer sectionOrder;
    private List<PostBlockDto> blocks;
    public PostSectionDto() {}

    public PostSectionDto(Long id, String title, Integer sectionOrder, List<PostBlockDto> blocks) {
        this.id = id;
        this.title = title;
        this.sectionOrder = sectionOrder;
        this.blocks = blocks;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getSectionOrder() {
        return sectionOrder;
    }

    public void setSectionOrder(Integer sectionOrder) {
        this.sectionOrder = sectionOrder;
    }

    public List<PostBlockDto> getBlocks() {
        return blocks;
    }

    public void setBlocks(List<PostBlockDto> blocks) {
        this.blocks = blocks;
    }
}

