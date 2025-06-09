package overcut.model.entities;


import jakarta.persistence.*;

import java.util.List;

@Entity
public class PostSection {

    private Long id;

    private Post post;

    private Integer sectionOrder;

    private String title;


    private List<PostBlock> blocks;

    public PostSection() {
    }

    public PostSection(Post post, Integer sectionOrder, String title) {
        this.post = post;
        this.sectionOrder = sectionOrder;
        this.title = title;
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
    @JoinColumn(name = "postId", nullable = false)
    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public Integer getSectionOrder() {
        return sectionOrder;
    }

    public void setSectionOrder(Integer sectionOrder) {
        this.sectionOrder = sectionOrder;
    }


    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }


    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("blockOrder ASC")
    public List<PostBlock> getBlocks() {
        return blocks;
    }

    public void setBlocks(List<PostBlock> blocks) {
        this.blocks = blocks;
    }
}
