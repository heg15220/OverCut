package overcut.model.entities;


import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface PostSectionDao extends CrudRepository<PostSection, Long> {

    List<PostSection> findByPostIdOrderBySectionOrder(Long postId);

    void deleteByPostId(Long postId);
}
