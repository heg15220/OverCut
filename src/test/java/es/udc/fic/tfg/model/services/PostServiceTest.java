package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.DuplicateInstanceException;
import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.PermissionException;
import es.udc.fic.tfg.model.services.exceptions.PostException;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The Class PostServiceTest.
 */
@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Transactional
class PostServiceTest {
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

    /** The category dao. */
    @Autowired
    private CategoryDao categoryDao;

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
                "stilo).,",LocalDateTime.now(),createUser(), createCategory());
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
                "sampleImage".getBytes(), true,0);
    }

    /**
     * Creates a category with default parameters.
     * @return the category
     */
    private Category createCategory() {
        return new Category("sampleName",false,false);
    }

    /**
     * Test entity Block.
     *
     * @throws InstanceNotFoundException  the instance not found exception
     * @throws DuplicateInstanceException the duplicate instance exception
     */
    @Test
    void testBlock() throws InstanceNotFoundException, DuplicateInstanceException {
        Post post = postDao.findPostById((long) 1);
        Block<Post> block = new Block<Post>(Arrays.asList(post), false);
        Block<?> block2 = new Block(null, true);
        Block<?> block3 = new Block(null, false);
        Block<?> block4 = new Block(null, false);
        int number = 1;
        assertTrue(block.equals(block));
        assertFalse(block.equals(null));
        assertFalse(block.equals(number));
        assertFalse(block.equals(block2));
        assertFalse(block.equals(block3));
        assertFalse(block3.equals(block));
        assertTrue(block3.equals(block4));
        assertEquals(block.hashCode(), block.hashCode());
        assertNotEquals(block.hashCode(), block2.hashCode());
        List<Integer> items = Arrays.asList(1, 2, 3, 4, 5);
        Block<Integer> block5 = new Block<>(items, false);
        Stream<Integer> stream = block5.stream();

        List<Integer> result = stream.collect(Collectors.toList());
        assertEquals(items, result);
    }


    /**
     * Test visualize all user posts.
     *
     * @throws InstanceNotFoundException  the instance not found exception
     * @throws DuplicateInstanceException the duplicate instance exception
     */
    @Test
    void testVisualizeAllUserPosts() throws InstanceNotFoundException, DuplicateInstanceException {
        User user = createUser();
        Category category = createCategory();

        // Case creating post without cupon
        Post post = createPost(user, category);
        post.setCreationDate(LocalDateTime.now().plusDays(6));

        categoryDao.save(category);
        userDao.save(user);
        postDao.save(post);

        Block<Post> expectedBlock = new Block<>(Arrays.asList(post), false);

        assertEquals(user, post.getUser());
        assertEquals(category, post.getCategory());

        assertEquals(expectedBlock, postService.visualizeAllUserPosts(user.getId(), 0, 1));

    }


    /**
     * Test visualize all user posts non existent id.
     */
    @Test
    void testVisualizeAllUserPostsNonExistentId() {
        assertThrows(InstanceNotFoundException.class, () -> postService.visualizeAllUserPosts(NON_EXISTENT_ID, 0, 1));

    }


    /**
     * Test create post.
     *
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PostException             the post exception
     */
    @Test
    void testCreatePost() throws InstanceNotFoundException, PostException {
        User user = createUser();
        Category category = createCategory();

        userDao.save(user);
        categoryDao.save(category);


        Post expectedPost = postService.createPost("cocheF1", "vendo ferrari en miniatura perfecto estado",
                "prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
        "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito",
                user.getId(),category.getId());

        assertNotNull(expectedPost);
        assertEquals("cocheF1", expectedPost.getTitle());
        assertEquals("vendo ferrari en miniatura perfecto estado", expectedPost.getSubtitle());
        assertEquals(user, expectedPost.getUser());
        assertEquals(category, expectedPost.getCategory());
        assertEquals("prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito", expectedPost.getArticle());

        Post post_2 = postService.createPost("cocheF2", "monoplaza en miniatura perfecto estado",
                "prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                        "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                        " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                        "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                        "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito",user.getId(),
                category.getId());

        assertNotNull(post_2);
        assertEquals("cocheF2", post_2.getTitle());
        assertEquals("monoplaza en miniatura perfecto estado", post_2.getSubtitle());
        assertEquals(user, post_2.getUser());
        assertEquals(category, post_2.getCategory());
        assertEquals("prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito", post_2.getArticle());
    }


    /**
     * Test modify post.
     *
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PermissionException       the permission exception
     * @throws PostException             the post exception
     */
    @Test
    void testModifyPost() throws InstanceNotFoundException, PermissionException, PostException {

        User user = createUser();
        Category category = createCategory();

        Post post = createPost();
        post.setUser(user);
        post.setCategory(category);

        categoryDao.save(category);
        userDao.save(user);
        postDao.save(post);

        postService.modifyPost( post.getId(),"motoGP", "la moto que acabó en perfecto estado",
                "prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                        "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                        " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                        "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                        "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito",
                user.getId(),category.getId());

        Post modifiedPost = postDao.findById(post.getId()).orElse(null);
        assertNotNull(modifiedPost);
        assertEquals("motoGP", modifiedPost.getTitle());
        assertEquals("la moto que acabó en perfecto estado", modifiedPost.getSubtitle());
        assertEquals(category.getId(), modifiedPost.getCategory().getId());
        assertEquals("prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito", modifiedPost.getArticle());
        assertEquals(user.getId(), modifiedPost.getUser().getId());

    }

    /**
     * Test modify post.
     *
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PermissionException       the permission exception
     * @throws PostException             the post exception
     */
    @Test
    void testModifyPostInstanceNotFoundException() throws InstanceNotFoundException, PermissionException, PostException {

        User user = createUser();
        Category category = createCategory();

        Post post = createPost();
        post.setUser(user);
        post.setCategory(category);

        categoryDao.save(category);
        userDao.save(user);
        postDao.save(post);

        assertThrows(PermissionException.class,
                () -> postService.modifyPost(post.getId(), "motoGP",
                        "vendo moto en miniatura perfecto estado","prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                                "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                                " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                                "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                                "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito"
                        ,(long) -1, category.getId()));


        assertThrows(InstanceNotFoundException.class,
                () -> postService.modifyPost(post.getId(), "motoGP","vendo moto en miniatura perfecto estado",
                        "prueba a`s9fijsoigvjreoidnbsr`p´bmjzde´ps`tjh0y0tpjke+ç'dxzk,v´<'jfqpowrjwrekh+'tnh0k`zdoskbvp<siuhfuer9ouhbn " +
                                "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                                " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                                "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                                "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito",
                        user.getId(),(long) -1));
    }

    /**
     * Test create post Post Exception
     */
    @Test
    void testCreatePostPostException() {

        User user1 = createUser();
        user1.setJournalist(false);
        Category category = createCategory();

        categoryDao.save(category);
        userDao.save(user1);

        assertThrows(PostException.class, () -> postService.createPost("Title", "Description",  "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                        " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                        "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                        "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito",
                user1.getId(),
                category.getId()));
    }

    /**
     * Test create post InstanceNotFoundException
     */
    @Test
    void testCreatePostInstanceNotFoundException() {

        User user1 = createUser();
        userDao.save(user1);

        assertThrows(InstanceNotFoundException.class, () -> postService.createPost("Title", "Description",
                "como por ejemplo Contenido aquí, contenido aquí. Estos textos hacen parecerlo un español que se puede leer." +
                        " Muchos paquetes de autoedición y editores de páginas web usan el Lorem Ipsum como su texto por defecto, y al hacer una búsq" +
                        "ueda de Lorem Ipsum va a dar por resultado muchos sitios web que usan este texto si se encue"+ "tran en estado de desarrollo. Muchas ve" +
                        "rsiones han evolucionado a través de los años, algunas veces por accidente, otras veces a propósito",
                user1.getId(), (long) -1));
    }

    /**
     * Test modify post permission exception
     */
    @Test
    void testModifyPostPermissionException() {

        User user1 = createUser();
        User user2 = createUser();
        user2.setUserName("user2");

        Category category = createCategory();

        Post post = createPost();
        post.setUser(user1);
        post.setCategory(category);

        categoryDao.save(category);
        userDao.save(user1);
        userDao.save(user2);
        postDao.save(post);

        assertThrows(PermissionException.class,
                () -> postService.modifyPost(post.getId(), "Modified Title", "Modified Description","prueba",
                        user2.getId(),category.getId()));
        categoryDao.save(category);
        userDao.save(user1);
        userDao.save(user2);
        postDao.save(post);
    }


    /**
     * Test delete post.
     *
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PermissionException       the permission exception
     */

    @Test
    void testDeletePost() throws InstanceNotFoundException, PermissionException {
        User user = createUser();
        Category category = createCategory();

        Post post = createPost(user, category);
        categoryDao.save(category);
        userDao.save(user);
        postDao.save(post);

        postService.deletePost(user.getId(), post.getId());

        assertFalse(postDao.existsById(post.getId()));
    }

    /**
     * Test delete post permission exception
     */

    @Test
    void testDeletePostPermissionException() {
        User user1 = createUser();
        User user2 = createUser();
        user2.setUserName("user2");

        Category category = createCategory();

        Post post = createPost(user1, category);

        categoryDao.save(category);
        userDao.save(user1);
        userDao.save(user2);
        postDao.save(post);

        assertThrows(PermissionException.class, () -> postService.deletePost(user2.getId(), post.getId()));
    }


    /**
     * Test delete non existent post
     */
    @Test
    void testDeleteNonExistentPost() {
        assertThrows(InstanceNotFoundException.class, () -> postService.deletePost(NON_EXISTENT_ID, NON_EXISTENT_ID));
    }


    /**
     * Test get post details
     *
     * @throws InstanceNotFoundException the instance not found exception
     */

    @Test
    void testGetPostDetails() throws InstanceNotFoundException {
        User user = createUser();
        Category category = createCategory();

        Post post = createPost(user, category);

        categoryDao.save(category);
        userDao.save(user);
        postDao.save(post);

        assertEquals(post, postService.getPostDetails((long) 1, post.getId()).getPost());
    }

    /**
     * Test get post details non existent postId
     */
    @Test
    void testGetPostDetailsNonExistentPostId() {
        User user = createUser();
        Category category = createCategory();

        Post post = createPost(user, category);

        categoryDao.save(category);
        userDao.save(user);
        postDao.save(post);
        assertThrows(InstanceNotFoundException.class,
                () -> postService.getPostDetails(NON_EXISTENT_ID, post.getId()).getPost());
    }

    /**
     * Test get post details non existent id
     */
    @Test
    void testGetPostDetailsNonExistentId() {
        assertThrows(InstanceNotFoundException.class, () -> postService.getPostDetails((long) 1, NON_EXISTENT_ID));
    }

    /**
     * Test add image instance not found Exception
     *
     * @throws PostException
     * @throws InstanceNotFoundException
     */
    @Test
    void testAddImageException() throws InstanceNotFoundException, PostException {

        User user1 = createUser();
        Category category = createCategory();

        categoryDao.save(category);
        userDao.save(user1);

        Post post = postService.createPost("cocheF1", "vendo ferrari en miniatura perfecto estado", "prueba",user1.getId(),
                category.getId());

        assertThrows(InstanceNotFoundException.class, () -> postService.addImage(post.getId(), null));
    }

    @Test
    void testGetAllCategories(){
        Category category= createCategory();

        categoryDao.save(category);

        assertNotEquals(null,postService.getAllCategories());
    }


}
