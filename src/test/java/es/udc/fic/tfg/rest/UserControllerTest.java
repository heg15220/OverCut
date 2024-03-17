package es.udc.fic.tfg.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.services.UserService;
import es.udc.fic.tfg.rest.common.ErrorsDto;
import es.udc.fic.tfg.rest.common.FieldErrorDto;
import es.udc.fic.tfg.rest.common.JwtInfo;
import es.udc.fic.tfg.rest.controllers.UserController;
import es.udc.fic.tfg.rest.dtos.AuthenticatedUserDto;
import es.udc.fic.tfg.rest.dtos.LoginParamsDto;
import es.udc.fic.tfg.rest.dtos.UserConversor;
import es.udc.fic.tfg.rest.dtos.UserDto;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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

    @Mock
    private UserService userService;

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
        mockMvc.perform(post("/api/users/signUp").content(mapper.writeValueAsBytes(user))
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
        mockMvc.perform(post("/api/users/signUp").content(mapper.writeValueAsBytes(user))
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
                        post("/api/users/loginFromServiceToken").contentType(MediaType.APPLICATION_JSON)
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

        mockMvc.perform(post("/api/users/login").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsBytes(loginParams))).andExpect(status().is(404));

    }

    @Test
    void test_updateProfile() throws Exception {
        // Preparar
        UserDto userDto = new UserDto(2L, "password", "FirstName", "LastName", "tfg@gmail.com", new byte[0], false);
        User user = UserConversor.toUser(userDto);
        userService.signUp(user); // Asegúrate de que este método esté mockeado para devolver un usuario válido

        // Simular el inicio de sesión de un usuario y obtener el token
        LoginParamsDto loginParams = new LoginParamsDto("tfg@gmail.com", "password");
        AuthenticatedUserDto authenticatedUserDto = new AuthenticatedUserDto("serviceTokenSimulado", userDto);
        User user2 = userService.login(loginParams.getEmail(), loginParams.getPassword());

        // Realizar la solicitud de login y capturar el token
        MvcResult result = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(loginParams)))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        if (response.isEmpty()) {
            new Exception("La respuesta está vacía");
        } else {
            AuthenticatedUserDto responseDto = new ObjectMapper().readValue(response, AuthenticatedUserDto.class);
            String token = responseDto.getServiceToken();

            // Continuar con el resto de la prueba usando el token
            UserDto params = new UserDto(3L, "FirstName", "UserName", "LastName", "probando1@gmail.com", new byte[0], false);

            ObjectMapper mapper = new ObjectMapper();

            mockMvc.perform(MockMvcRequestBuilders.put("/api/users/1").header("Authorization", "Bearer " + token)
                    .header("userId", "1").content(mapper.writeValueAsString(params))
                    .contentType(MediaType.APPLICATION_JSON)).andExpect(status().isOk());
        }

    }
}

