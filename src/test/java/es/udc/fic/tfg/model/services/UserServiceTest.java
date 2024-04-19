package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.DuplicateInstanceException;
import es.udc.fic.tfg.model.common.exceptions.InstanceException;
import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.entities.UserDao;
import es.udc.fic.tfg.model.services.exceptions.IncorrectLoginException;
import es.udc.fic.tfg.model.services.exceptions.IncorrectPasswordException;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The Class UserServiceTest.
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserServiceTest {
    /** The user service. */
    @Autowired
    private UserService userService;

    @Autowired
    private PermissionChecker permisionChecker;

    @Autowired
    private UserDao userDao;

    /**
     * Creates the user.
     * @return the user
     */
    private User createUser() {
        return new User("josealonso", "pwd", "Jose", "Alonso", "jose.alonso@udc.es",
                null,false, 0);
    }

    @Test
    void testCheckUserException() {
        assertThrows(InstanceNotFoundException.class, () -> {
            permisionChecker.checkUser((long) -1);
        });
    }

    @Test
    void testCheckUserExistsException() {
        assertThrows(InstanceNotFoundException.class, () -> {
            permisionChecker.checkUserExists((long) -1);
        });
    }

    @Test
    void testCheckUserExists() throws DuplicateInstanceException {
        User user = createUser();
        userService.signUp(user);
        assertDoesNotThrow(() -> {
            permisionChecker.checkUserExists(user.getId());
        });
    }

    /**
     * Test Instance Exception.
     */
    @Test
    void testInstanceException() {
        User user = createUser();
        try {
            userService.signUp(user);
            userService.signUp(user);

        } catch (InstanceException e) {
            assertEquals("project.entities.user",e.getName());
            assertEquals(e.getKey(), user.getUserName());

        }
    }


    /**
     * Test sign up and login from id.
     *
     * @throws DuplicateInstanceException the duplicate instance exception
     * @throws InstanceNotFoundException  the instance not found exception
     */
    @Test
    void testSignUpAndLoginFromId() throws DuplicateInstanceException, InstanceNotFoundException {

        User user = createUser();

        userService.signUp(user);

        User loggedInUser = userService.loginFromId(user.getId());

        assertEquals(user, loggedInUser);
        assertEquals(loggedInUser.isJournalist(), user.isJournalist());

    }

    @Test
    void testLoginUnexistantUser() {
        assertThrows(IncorrectLoginException.class, () -> {
            userService.login("fakeemail@gmail.com", "pws");
        });
    }

    @Test
    void testIncorrectLoginException() {
        try {
            userService.login("fakeuser@gmail.com", "pws");
        } catch (IncorrectLoginException e) {
            assertEquals("fakeuser@gmail.com",e.getUserName());
            assertEquals("pws", e.getPassword());

        }
    }

    @Test
    void testLoginIncorrectPassword() throws DuplicateInstanceException {
        User user = new User();
        user.setUserName("josealonso");
        user.setPassword("pwd");
        user.setFirstName("Jose");
        user.setLastName("Alonso");
        user.setEmail("jose.alonso@udc.es");
        user.setImage("josealonso".getBytes());
        user.setJournalist(false);

        userService.signUp(user);

        assertThrows(IncorrectLoginException.class, () -> {
            userService.login("jose.alonso@udc.es", "INCORRECT");
        });
    }

    @Test
    void testDuplicateSignUp() throws DuplicateInstanceException {
        User user = createUser();

        userService.signUp(user);
        assertThrows(DuplicateInstanceException.class, () -> {
            userService.signUp(user);
        });

    }
    /**
     * Test sign up and login from id.
     *
     * @throws DuplicateInstanceException the duplicate instance exception
     * @throws InstanceNotFoundException  the instance not found exception
     */
    @Test
    void testSignUpAndLoginFromIdAlt() throws DuplicateInstanceException, InstanceNotFoundException {

        User user = new User();
        user.setUserName("josealonso");
        user.setPassword("pwd");
        user.setFirstName("Jose");
        user.setLastName("Alonso");
        user.setEmail("jose.alonso@udc.es");
        user.setImage("josealonso".getBytes());

        userService.signUp(user);

        User loggedInUser = userService.loginFromId(user.getId());

        assertEquals(user, loggedInUser);
        assertEquals(loggedInUser.isJournalist(), user.isJournalist());

    }

    @Test
    void testChangePassword()
            throws DuplicateInstanceException, InstanceNotFoundException, IncorrectPasswordException {
        User user = new User();
        user.setUserName("josealonso");
        user.setPassword("pwd");
        user.setFirstName("Jose");
        user.setLastName("Alonso");
        user.setEmail("jose.alonso@udc.es");
        user.setImage("josealonso".getBytes());

        userService.signUp(user);

        User found = userDao.findById(user.getId()).get();

        String old_pwd = found.getPassword();

        userService.changePassword(found.getId(), "pwd", "new");

        found = userDao.findById(user.getId()).get();

        assertNotEquals(old_pwd, found.getPassword());
    }

    @Test
    void testChangeSamePassword()
            throws DuplicateInstanceException {
        User user = new User();
        user.setUserName("josealonso");
        user.setPassword("pwd");
        user.setFirstName("Jose");
        user.setLastName("Alonso");
        user.setEmail("jose.alonso@udc.es");
        user.setImage("josealonso".getBytes());

        userService.signUp(user);

        User found = userDao.findById(user.getId()).get();

        assertThrows(IncorrectPasswordException.class, () -> {
            userService.changePassword(found.getId(), "powd", "pwd");
        });

    }
        @Test
        void testDuplicateEmailSignUp() throws DuplicateInstanceException{
            User user = createUser();

            userService.signUp(user);
            User user2 = new User();
            user2.setUserName("prueba");
            user2.setPassword("f1");
            user2.setJournalist(true);
            user2.setFirstName("lucas");
            user2.setEmail(user.getEmail());


            assertThrows(DuplicateInstanceException.class, () -> {
                userService.signUp(user2);
            });
        }

    @Test
    void testAddImage() throws Exception {
        User user = new User();
        user.setUserName("josealonso");
        user.setPassword("pwd");
        user.setFirstName("Jose");
        user.setLastName("Alonso");
        user.setEmail("jose.alonso@udc.es");
        user.setImage("josealonso".getBytes());
        user.setJournalist(true);

        userService.signUp(user);

        User loggedInUser = userService.loginFromId(user.getId());

        byte[] imageContent = "fake image content".getBytes();
        MockMultipartFile image = new MockMultipartFile("image", "image.png", "image/png", imageContent);

        userService.addImage(loggedInUser.getId(), image);

        User updatedUser = userService.loginFromId(user.getId());
        assertNotNull(updatedUser.getImage());
    }


    @Test
    void testAddNullImage() throws InstanceNotFoundException, DuplicateInstanceException {
        User user = new User();
        user.setUserName("josealonso");
        user.setPassword("pwd");
        user.setFirstName("Jose");
        user.setLastName("Alonso");
        user.setEmail("jose.alonso@udc.es");
        user.setImage("josealonso".getBytes());
        user.setJournalist(false);

        userService.signUp(user);

        User loggedInUser = userService.loginFromId(user.getId());

        assertThrows(InstanceNotFoundException.class, () -> {
            userService.addImage(user.getId(), null);
        });
    }

    @Test
    void testUpdateProfileSuccess() throws InstanceNotFoundException {
        // Preparar
        Long id = 1L;
        String firstName = "NuevoNombre";
        String lastName = "NuevoApellido";
        String email = "nuevo@email.com";
        User user = new User();
        user.setId(id);
        user.setFirstName("AntiguoNombre");
        user.setLastName("AntiguoApellido");
        user.setEmail("antiguo@email.com");

        userDao.save(user);
        permisionChecker.checkUser(id);

        User updatedUser = userService.updateProfile(id, firstName, lastName, email);

        assertEquals(firstName, updatedUser.getFirstName());
        assertEquals(lastName, updatedUser.getLastName());
        assertEquals(email, updatedUser.getEmail());
    }

}


