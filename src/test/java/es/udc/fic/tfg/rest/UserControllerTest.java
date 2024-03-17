package es.udc.fic.tfg.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.rest.common.ErrorsDto;
import es.udc.fic.tfg.rest.common.FieldErrorDto;
import es.udc.fic.tfg.rest.common.JwtInfo;
import es.udc.fic.tfg.rest.controllers.UserController;
import es.udc.fic.tfg.rest.dtos.LoginParamsDto;
import es.udc.fic.tfg.rest.dtos.UserConversor;
import es.udc.fic.tfg.rest.dtos.UserDto;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The Class UserControllerTest.
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserControllerTest {
    /** The mockMvc. */
    @Autowired
    private MockMvc mockMvc;

    /** The user controller. */
    @Autowired
    private UserController userController;

    /**
     * Test sign up.
     *
     * @throws Exception the exception
     */
    @Test
    void test_SignUp() throws Exception {
        UserDto user = UserConversor.toUserDto(
                new User("name", "password", "firstName", "lastName", "user@mail.gg", "uwu".getBytes(), false));
        user.setPassword("password");

        ObjectMapper mapper = new ObjectMapper();
        mockMvc.perform(MockMvcRequestBuilders.post("/api/users/signUp").content(mapper.writeValueAsBytes(user))
                .contentType(MediaType.APPLICATION_JSON)).andExpect(status().is(201));
    }

    /**
     * Test sign up.
     *
     * @throws Exception the exception
     */
    @Test
    void test_JwtInfo() {
        JwtInfo jwtinfo = new JwtInfo(null, null, false);
        jwtinfo.setUserId((long) 2);
        jwtinfo.setEmail("userName@gmail.com");
        jwtinfo.setRole(true);
        assertEquals(true, jwtinfo.isRole());
        assertEquals("userName@gmail.com",jwtinfo.getEmail());
        long userId = jwtinfo.getUserId();
        assertEquals(2, userId);
    }

    /**
     * Test ErrorsDto.
     *
     * @throws Exception the exception
     */
    @Test
    void test_ErrorsDto() throws Exception {
        FieldErrorDto fieldError1 = new FieldErrorDto("field1", "error1");
        FieldErrorDto fieldError2 = new FieldErrorDto("field2", "error2");
        List<FieldErrorDto> fieldErrors = Arrays.asList(fieldError1, fieldError2);
        FieldErrorDto fieldError3 = new FieldErrorDto("field3", "error3");
        FieldErrorDto fieldError4 = new FieldErrorDto("field4", "error4");
        List<FieldErrorDto> fieldErrors2 = Arrays.asList(fieldError3, fieldError4);
        ErrorsDto errorsDto = new ErrorsDto(fieldErrors);
        errorsDto.setFieldErrors(fieldErrors2);
        assertEquals(errorsDto.getFieldErrors(), fieldErrors2);
    }

    /**
     * Test FieldErrorDto.
     *
     * @throws Exception the exception
     */
    @Test
    void test_FieldErrorDto() throws Exception {
        FieldErrorDto fieldError = new FieldErrorDto("field1", "error1");
        assertEquals("field1",fieldError.getFieldName());
        assertEquals("error1", fieldError.getMessage());
    }

    /**
     * Test sign up with a null userName.
     *
     * @throws Exception the exception
     */
    @Test
    void test_SignUpWithNullUserName() throws Exception {
        UserDto user = UserConversor.toUserDto(
                new User(null, "password", "firstName", "lastName", "user@mail.gg", "uwu".getBytes(), false));
        user.setPassword("password");

        ObjectMapper mapper = new ObjectMapper();
        mockMvc.perform(MockMvcRequestBuilders.post("/api/users/signUp").content(mapper.writeValueAsBytes(user))
                .contentType(MediaType.APPLICATION_JSON)).andExpect(status().is(400));
    }

    /**
     * Test Login from Service Token.
     *
     * @throws Exception the exception
     */
    @Test
    void test_LoginFromServiceToken() throws Exception {
        LoginParamsDto loginParams = new LoginParamsDto();
        loginParams.setEmail("overcut@gmail.com");
        loginParams.setPassword("f1");

        ObjectMapper mapper = new ObjectMapper();

        mockMvc.perform(
                        MockMvcRequestBuilders.post("/api/users/loginFromServiceToken").contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsBytes(loginParams)).with(request -> {
                                    request.setAttribute("userId", "1");
                                    request.setAttribute("serviceToken", "serviceTokenValue");
                                    return request;
                                }))
                .andExpect(status().isOk());
    }

    /**
     * Test login.
     *
     * @throws Exception the exception
     */


    @Test
    void testHandleIncorrectLoginException() throws Exception {
        LoginParamsDto loginParams = new LoginParamsDto();
        loginParams.setEmail("ghjkl@gmail.com");
        loginParams.setPassword("f4");

        ObjectMapper mapper = new ObjectMapper();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/users/login").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsBytes(loginParams))).andExpect(status().is(404));

    }
}
