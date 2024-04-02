package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;

public interface CustomizedPostDao {
    /**
     * Find filter post.
     *
     * @param title      the title
     * @param categoryId the category id
     * @param page       the page
     * @param size       the size
     * @return the slice post
     */
    Slice<Post> findFilterPost(String title, Long categoryId, Short criteria, boolean order, int page, int size);
}
