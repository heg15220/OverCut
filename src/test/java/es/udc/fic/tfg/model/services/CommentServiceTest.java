package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The Class CommentServiceTest.
 */
@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Transactional
class CommentServiceTest {

    /** The non existent id. */
    private final Long NON_EXISTENT_ID = Long.valueOf(-1);

    /** The user dao. */
    @Autowired
    private UserDao userDao;

    /** The post dao. */
    @Autowired
    private PostDao postDao;

    /** The post service. */
    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    /** The category dao. */
    @Autowired
    private CategoryDao categoryDao;

    @Autowired
    private CommentDao commentDao;

    /**
     * Creates a sample post
     *
     * @return a post with default values in all fields
     */
    private Post createPost() {
        return new Post("testName", "testsubtitle", "sampleImage".getBytes(),"a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito (por ejemplo insertándole humor y cosas por el e" +
                "stilo).,", LocalDateTime.now(),createUser(), createCategory());
    }

    private Post createPost(User user, Category category) {
        Post post = createPost();
        post.setUser(user);
        post.setCategory(category);
        return post;
    }

    /**
     * Creates a user with default parameters.
     *
     * @return the user
     */
    private User createUser() {
        return new User("sampleUserName", "samplePassword", "sampleFirstName", "sampleLastName", "sample@mail.ex",
                "sampleImage".getBytes(), true);
    }

    /**
     * Creates a category with default parameters.
     * @return the category
     */
    private Category createCategory() {
        return new Category("sampleName",false,false);
    }


    /**
     * Test InstanceNotFoundException to add answer
     */
    @Test
    void testAddCommentPostDoesNotExist() {
        assertThrows(InstanceNotFoundException.class, () -> commentService.addComment((long) 55, (long) 1, "String"));

    }

    /**
     * Test InstanceNotFoundException to add answer
     */
    @Test
    void testAddCommentUserDoesNotExist() {
        assertThrows(InstanceNotFoundException.class, () -> commentService.addComment((long) 1, (long) 55, "String"));
    }

    @Test
    void testAddComment() throws InstanceNotFoundException, Exception {
        String content = "Este es el comentario";

        Comment comment = commentService.addComment((long) 1, (long) 1, content);

        assertEquals(1, comment.getUser().getId());
        assertEquals(1, comment.getPost().getId());

        assertEquals(content, comment.getContent());

    }
    /**
     * Test modify comment.
     *
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Test
    void testModifyComment() throws InstanceNotFoundException {
        String content = "Este es el comentario";

        Comment comment = commentService.addComment((long) 1, (long) 1, content);
        String modifiedContent = "contenido modificado";
        commentService.modifyComment(comment.getId(), modifiedContent);

        assertEquals(modifiedContent, comment.getContent());
    }

    @Test
    void testModifyCommentNoComment() throws InstanceNotFoundException {
        String modifiedContent = "contenido modificado";
        assertThrows(InstanceNotFoundException.class,
                () -> commentService.modifyComment(NON_EXISTENT_ID, modifiedContent));
    }

    /**
     * Test delete comment.
     *
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Test
    void testDeleteComment() throws InstanceNotFoundException {
        String content = "Este es el comentario";

        Comment comment = commentService.addComment((long) 1, (long) 1, content);

        commentService.deleteComment(comment.getId());

        assertFalse(commentDao.existsById(comment.getId()));
    }

    @Test
    void testDeleteCommentNoComment() throws InstanceNotFoundException {
        assertThrows(InstanceNotFoundException.class, () -> commentService.deleteComment(NON_EXISTENT_ID));
    }

    /**
     * Test add answer.
     *
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Test
    void testAddAnswer() throws InstanceNotFoundException {
        String content = "Este es el comentario";

        Comment comment = commentService.addComment((long) 1, (long) 1, content);

        String contentAnswer = "Esta es la respuesta";
        Comment answer = commentService.addAnswer(comment.getId(), comment.getUser().getId(), contentAnswer);

        assertEquals(contentAnswer, answer.getContent());
        assertEquals(comment.getId(), answer.getParentComment().getId());
    }

    @Test
    void testGetComments() throws InstanceNotFoundException {
        String content = "Este es el comentario";
        Comment comment1 = commentDao.findById((long) 1).get();
        Comment comment2 = commentService.addComment((long) 1, (long) 1, "hola");
        Block<Comment> expectedBlock = new Block<>(Arrays.asList(comment1, comment2), false);
        Block<Comment> resultBlock = commentService.getComments((long) 1, 0, 2);
        assertEquals(expectedBlock, resultBlock);
    }



}
