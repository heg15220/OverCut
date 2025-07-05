package overcut.model.entities;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

/**
 * The class CustomizedPostDaoImpl
 */
public class CustomizedPostDaoImpl implements CustomizedPostDao {

    /**
     * The entity manager.
     */
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Find filter post.
     *
     * @param title      the title
     * @param categoryId the category id
     * @param criteria   to show creationDate-0,
     * @param page       the page
     * @param size       the size
     * @return the slice post
     */
    @SuppressWarnings("unchecked")
    @Override
    public Slice<Post> findFilterPost(String title, Long categoryId, Short criteria, boolean order, String language, int page, int size) {
        String query = buildQuery(title, categoryId, criteria, order, language);
        Query querySentence = entityManager.createQuery(query).setFirstResult(page * size).setMaxResults(size + 1);
        setParameters(querySentence, title, categoryId, language);

        List<Post> posts = querySentence.getResultList();
        boolean hasNextPost = posts.size() == (size + 1);

        if (hasNextPost) {
            posts.remove(posts.size() - 1);
        }

        return new SliceImpl<>(posts, PageRequest.of(page, size), hasNextPost);
    }

    private String buildQuery(String title, Long categoryId, Short criteria, boolean order, String language) {
        StringBuilder query = new StringBuilder("SELECT p FROM Post p");

        boolean hasCondition = false;

        if (title != null || categoryId != null || language != null) {
            query.append(" WHERE ");
        }

        if (title != null) {
            query.append("UPPER(p.title) LIKE UPPER(:title)");
            hasCondition = true;
        }

        if (categoryId != null) {
            if (hasCondition) query.append(" AND ");
            query.append("p.category.id = :categoryId");
            hasCondition = true;
        }

        if (language != null) {
            if (hasCondition) query.append(" AND ");
            query.append("p.language = :language");
        }

        query.append(order ? " ORDER BY p.creationDate ASC" : " ORDER BY p.creationDate DESC");

        return query.toString();
    }


    private void setParameters(Query querySentence, String title, Long categoryId, String language) {
        if (title != null) {
            querySentence.setParameter("title", "%" + title + "%");
        }
        if (categoryId != null) {
            querySentence.setParameter("categoryId", categoryId);
        }
        if (language != null) {
            querySentence.setParameter("language", language);
        }
    }

}
