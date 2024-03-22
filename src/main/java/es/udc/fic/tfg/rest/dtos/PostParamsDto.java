package es.udc.fic.tfg.rest.dtos;

import jakarta.persistence.Lob;

import java.time.LocalDateTime;

public class PostParamsDto {
    /** The title. */
    private String title;

    /** The description. */
    private String subtitle;

    private String article;

    /** The category. */
    private Long categoryId;

    /** The image. */
    @Lob
    private byte[] image;

    private LocalDateTime creationDate;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public byte[] getImage() {
        return image;
    }

    public void setImage(byte[] image) {
        this.image = image;
    }

    public LocalDateTime getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getArticle() {
        return article;
    }

    public void setArticle(String article) {
        this.article = article;
    }
}
