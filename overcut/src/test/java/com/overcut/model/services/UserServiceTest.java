/*
package com.overcut.model.services;

import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;
import overcut.model.common.exceptions.DuplicateInstanceException;
import overcut.model.common.exceptions.InstanceException;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.User;
import overcut.model.entities.UserDao;
import overcut.model.services.PermissionChecker;
import overcut.model.services.UserService;
import overcut.model.services.exceptions.IncorrectLoginException;
import overcut.model.services.exceptions.IncorrectPasswordException;
import overcut.model.services.exceptions.InvalidEmailException;

import static org.junit.jupiter.api.Assertions.*;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = overcut.Application.class)
@ActiveProfiles("test")
@Transactional
class UserServiceTest {
    @Autowired
    private UserService userService;

    @Autowired
    private PermissionChecker permisionChecker;

    @Autowired
    private UserDao userDao;

    private static int counter = 0;

    private User createUser(String username, String email) {
        return new User(username, "pwd", "Jose", "Alonso", email, null, false, 0);
    }

    private String generateUniqueEmail() {
        return "real.existing.email+test" + (counter++) + "@gmail.com";
    }

    @Test
    void testCheckUserException() {
        assertThrows(InstanceNotFoundException.class, () -> permisionChecker.checkUser((long) -1));
    }

    @Test
    void testCheckUserExistsException() {
        assertThrows(InstanceNotFoundException.class, () -> permisionChecker.checkUserExists((long) -1));
    }

    @Test
    void testCheckUserExists() throws DuplicateInstanceException, InvalidEmailException {
        User user = createUser("userCheck", generateUniqueEmail());
        userService.signUp(user);
        assertDoesNotThrow(() -> permisionChecker.checkUserExists(user.getId()));
    }

    @Test
    void testInstanceException() throws InvalidEmailException {
        User user = createUser("userEx", generateUniqueEmail());
        try {
            userService.signUp(user);
            userService.signUp(user);
        } catch (InstanceException e) {
            assertEquals("project.entities.user", e.getName());
            assertEquals(e.getKey(), user.getUserName());
        }
    }

    @Test
    void testSignUpAndLoginFromId() throws DuplicateInstanceException, InstanceNotFoundException, InvalidEmailException {
        User user = createUser("user1", generateUniqueEmail());
        userService.signUp(user);
        User loggedInUser = userService.loginFromId(user.getId());
        assertEquals(user, loggedInUser);
    }

    @Test
    void testLoginUnexistantUser() {
        assertThrows(IncorrectLoginException.class, () -> userService.login("fakeemail@gmail.com", "pws"));
    }

    @Test
    void testIncorrectLoginException() {
        try {
            userService.login("fakeuser@gmail.com", "pws");
        } catch (IncorrectLoginException e) {
            assertEquals("fakeuser@gmail.com", e.getUserName());
            assertEquals("pws", e.getPassword());
        }
    }

    @Test
    void testLoginIncorrectPassword() throws DuplicateInstanceException, InvalidEmailException {
        User user = createUser("user2", generateUniqueEmail());
        user.setImage("prueba".getBytes());
        userService.signUp(user);
        assertThrows(IncorrectLoginException.class, () -> userService.login(user.getEmail(), "INCORRECT"));
    }

    @Test
    void testDuplicateSignUp() throws DuplicateInstanceException, InvalidEmailException {
        User user = createUser("user3", generateUniqueEmail());
        userService.signUp(user);
        assertThrows(DuplicateInstanceException.class, () -> userService.signUp(user));
    }

    @Test
    void testSignUpAndLoginFromIdAlt() throws DuplicateInstanceException, InstanceNotFoundException, InvalidEmailException {
        User user = createUser("user4", generateUniqueEmail());
        user.setImage("img".getBytes());
        userService.signUp(user);
        User loggedInUser = userService.loginFromId(user.getId());
        assertEquals(user, loggedInUser);
    }

    @Test
    void testChangePassword() throws DuplicateInstanceException, InstanceNotFoundException, IncorrectPasswordException, InvalidEmailException {
        User user = createUser("user5", generateUniqueEmail());
        user.setImage("img".getBytes());
        userService.signUp(user);
        User found = userDao.findById(user.getId()).get();
        String old_pwd = found.getPassword();
        userService.changePassword(found.getId(), "pwd", "new");
        found = userDao.findById(user.getId()).get();
        assertNotEquals(old_pwd, found.getPassword());
    }

    @Test
    void testChangeSamePassword() throws DuplicateInstanceException, InvalidEmailException {
        User user = createUser("user6", generateUniqueEmail());
        user.setImage("img".getBytes());
        userService.signUp(user);
        User found = userDao.findById(user.getId()).get();
        assertThrows(IncorrectPasswordException.class, () -> userService.changePassword(found.getId(), "powd", "pwd"));
    }

    @Test
    void testDuplicateEmailSignUp() throws DuplicateInstanceException, InvalidEmailException {
        String email = generateUniqueEmail();
        User user = createUser("user7", email);
        userService.signUp(user);
        User user2 = createUser("user8", email);
        assertThrows(DuplicateInstanceException.class, () -> userService.signUp(user2));
    }

    @Test
    void testAddImage() throws Exception {
        User user = createUser("user9", generateUniqueEmail());
        user.setImage("img".getBytes());
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
    void testAddNullImage() throws InstanceNotFoundException, DuplicateInstanceException, InvalidEmailException {
        User user = createUser("user10", generateUniqueEmail());
        user.setImage("img".getBytes());
        userService.signUp(user);
        assertThrows(InstanceNotFoundException.class, () -> userService.addImage(user.getId(), null));
    }

    @Test
    void testUpdateProfileSuccess() throws InstanceNotFoundException {
        Long id = 1L;
        String firstName = "NuevoNombre";
        String lastName = "NuevoApellido";
        String email = generateUniqueEmail();
        User user = new User();
        user.setId(id);
        user.setFirstName("AntiguoNombre");
        user.setLastName("AntiguoApellido");
        user.setEmail("old@email.com");
        userDao.save(user);
        permisionChecker.checkUser(id);
        User updatedUser = userService.updateProfile(id, firstName, lastName, email);
        assertEquals(firstName, updatedUser.getFirstName());
        assertEquals(lastName, updatedUser.getLastName());
        assertEquals(email, updatedUser.getEmail());
    }
}
*/
