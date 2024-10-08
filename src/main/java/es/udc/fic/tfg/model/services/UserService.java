package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.DuplicateInstanceException;
import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.services.exceptions.IncorrectLoginException;
import es.udc.fic.tfg.model.services.exceptions.IncorrectPasswordException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * The Interface UserService.
 */
public interface UserService {
    /**
     * Sign up.
     *
     * @param user the user
     * @throws DuplicateInstanceException the duplicate instance exception
     */
    void signUp(User user) throws DuplicateInstanceException;

    /**
     * Login.
     *
     * @param email the user name
     * @param password the password
     * @return the user
     * @throws IncorrectLoginException the incorrect login exception
     */
    User login(String email, String password) throws IncorrectLoginException;

    /**
     * Login from id.
     *
     * @param id the id
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     */
    User loginFromId(Long id) throws InstanceNotFoundException;

    /**
     * Add image.
     *
     * @param userId the user id
     * @param image the image
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     * @throws IOException the IO exception
     */
    User addImage(Long userId, MultipartFile image) throws InstanceNotFoundException, IOException;
    /**
     * Change password.
     *
     * @param id the id
     * @param oldPassword the old password
     * @param newPassword the new password
     * @throws InstanceNotFoundException the instance not found exception
     * @throws IncorrectPasswordException the incorrect password exception
     */
    void changePassword(Long id, String oldPassword, String newPassword)
            throws InstanceNotFoundException, IncorrectPasswordException;

    /**
     * Update profile.
     *
     * @param id the id
     * @param firstName the first name
     * @param lastName the last name
     * @param email the email
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     */
    User updateProfile(Long id, String firstName, String lastName, String email) throws InstanceNotFoundException;

    int getAmountOfPointsInAllQuiz(Long userId) throws InstanceNotFoundException;


}
