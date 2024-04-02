package es.udc.fic.tfg.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import es.udc.fic.tfg.rest.controllers.UserController;
import es.udc.fic.tfg.rest.dtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The Class PostControllerTest.
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PostControllerTest {
    /** The mockMvc. */
    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("testUser", "password", new ArrayList<>())
        );
    }

    @Test
    void testPostDto() {
        // Create a byte array for the image
        byte[] image = "image".getBytes();

        // Create a LocalDateTime for the creation date
        LocalDateTime creationDate = LocalDateTime.now();

        // Create a PostDto instance
        PostDto postDto = new PostDto(
                523L, "PostDtoTest", "descriptionTest", image, "articleTest",
                creationDate, 1L, "userNameTest", 1L, "Category1"
        );

        // Assert that the getters return the expected values
        assertEquals(523L, postDto.getId());
        assertEquals("PostDtoTest", postDto.getTitle());
        assertEquals("descriptionTest", postDto.getSubtitle());
        assertEquals(image, postDto.getImage());
        assertEquals("articleTest", postDto.getArticle());
        assertEquals(creationDate, postDto.getCreationDate());
        assertEquals(1L, postDto.getUserId());
        assertEquals("userNameTest", postDto.getUserName());
        assertEquals(1L, postDto.getCategoryId());
        assertEquals("Category1", postDto.getCategoryName());

        // Set new values using setters and assert that they are correctly set
        postDto.setId(602L);
        postDto.setTitle("test");
        postDto.setSubtitle("description");
        postDto.setImage(image);
        postDto.setArticle("articleTest");
        postDto.setCreationDate(creationDate);
        postDto.setUserId(2L);
        postDto.setUserName("userName");
        postDto.setCategoryId(2L);
        postDto.setCategoryName("Category2");

        assertEquals(602L, postDto.getId());
        assertEquals("test", postDto.getTitle());
        assertEquals("description", postDto.getSubtitle());
        assertEquals(image, postDto.getImage());
        assertEquals("articleTest", postDto.getArticle());
        assertEquals(creationDate, postDto.getCreationDate());
        assertEquals(2L, postDto.getUserId());
        assertEquals("userName", postDto.getUserName());
        assertEquals(2L, postDto.getCategoryId());
        assertEquals("Category2", postDto.getCategoryName());
    }

    @Test
    void testCategoryDto() {
        // Create a CategoryDto instance
        CategoryDto categoryDto = new CategoryDto(1489L, "anecdotas", true, false);

        // Assert that the getters return the expected values
        assertEquals(1489L, categoryDto.getCategoryId());
        assertEquals("anecdotas", categoryDto.getName());
        assertEquals(true, categoryDto.isHistoric());
        assertEquals(false, categoryDto.isQuiz());

        // Set new values using setters and assert that they are correctly set
        categoryDto.setCategoryId(1490L);
        categoryDto.setName("newName");
        categoryDto.setHistoric(false);
        categoryDto.setQuiz(true);

        assertEquals(1490L, categoryDto.getCategoryId());
        assertEquals("newName", categoryDto.getName());
        assertEquals(false, categoryDto.isHistoric());
        assertEquals(true, categoryDto.isQuiz());
    }

    @Test
    void testBlockDto() {
        // Create a list of items
        List<String> items = Arrays.asList("Item1", "Item2", "Item3");

        // Create a BlockDto instance
        BlockDto<String> blockDto = new BlockDto<>(items, true);

        // Assert that the getters return the expected values
        assertEquals(items, blockDto.getItems());
        assertTrue(blockDto.getExistMoreItems());

        // Set new values using setters and assert that they are correctly set
        List<String> newItems = Arrays.asList("NewItem1", "NewItem2");
        blockDto.setItems(newItems);
        blockDto.setExistMoreItems(false);

        assertEquals(newItems, blockDto.getItems());
        assertEquals(false, blockDto.getExistMoreItems());
    }



}
