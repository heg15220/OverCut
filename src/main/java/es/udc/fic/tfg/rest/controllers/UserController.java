package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.DuplicateInstanceException;
import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.services.UserService;
import es.udc.fic.tfg.model.services.exceptions.IncorrectLoginException;
import es.udc.fic.tfg.model.services.exceptions.IncorrectPasswordException;
import es.udc.fic.tfg.model.services.exceptions.PermissionException;
import es.udc.fic.tfg.rest.common.ErrorsDto;
import es.udc.fic.tfg.rest.common.JwtGenerator;
import es.udc.fic.tfg.rest.common.JwtInfo;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;

import static es.udc.fic.tfg.rest.dtos.UserConversor.*;

/**
 * The Class UserController.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    /** The Constant INCORRECT_LOGIN_EXCEPTION_CODE. */
    private static final String INCORRECT_LOGIN_EXCEPTION_CODE = "project.exceptions.IncorrectLoginException";

    /** The Constant INCORRECT_PASSWORD_EXCEPTION_CODE. */
    private static final String INCORRECT_PASS_EXCEPTION_CODE = "project.exceptions.IncorrectPasswordException";

    /** The message source. */
    @Autowired
    private MessageSource messageSource;

    /** The jwt generator. */
    @Autowired
    private JwtGenerator jwtGenerator;

    /** The user service. */
    @Autowired
    private UserService userService;

    /**
     * Handle incorrect login exception.
     *
     * @param exception the exception
     * @param locale    the locale
     * @return the errors dto
     */
    @ExceptionHandler(IncorrectLoginException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorsDto handleIncorrectLoginException(IncorrectLoginException exception, Locale locale) {

        String errorMessage = messageSource.getMessage(INCORRECT_LOGIN_EXCEPTION_CODE, null,
                INCORRECT_LOGIN_EXCEPTION_CODE, locale);

        return new ErrorsDto(errorMessage);

    }

    /**
     * Handle incorrect password exception.
     *
     * @param exception the exception
     * @param locale    the locale
     * @return the errors dto
     */
    @ExceptionHandler(IncorrectPasswordException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorsDto handleIncorrectPasswordException(IncorrectPasswordException exception, Locale locale) {

        String errorMessage = messageSource.getMessage(INCORRECT_PASS_EXCEPTION_CODE, null,
                INCORRECT_PASS_EXCEPTION_CODE, locale);

        return new ErrorsDto(errorMessage);

    }

    /**
     * Sign up.
     *
     * @param userDto the user dto
     * @return the response entity
     * @throws DuplicateInstanceException the duplicate instance exception
     */
    @PostMapping("/signUp")
    public ResponseEntity<AuthenticatedUserDto> signUp(
            @Validated({ UserDto.AllValidations.class }) @RequestBody UserDto userDto)
            throws DuplicateInstanceException {

        User user = toUser(userDto);

        userService.signUp(user);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(user.getId())
                .toUri();

        return ResponseEntity.created(location).body(toAuthenticatedUserDto(generateServiceToken(user), user));

    }

    /**
     * Login.
     *
     * @param params the params
     * @return the authenticated user dto
     * @throws IncorrectLoginException the incorrect login exception
     */
    @PostMapping("/login")
    public AuthenticatedUserDto login(@Validated @RequestBody LoginParamsDto params) throws IncorrectLoginException {

        User user = userService.login(params.getEmail(), params.getPassword());

        return toAuthenticatedUserDto(generateServiceToken(user), user);

    }

    /**
     * Login from service token.
     *
     * @param userId       the user id
     * @param serviceToken the service token
     * @return the authenticated user dto
     * @throws InstanceNotFoundException the instance not found exception
     */
    @PostMapping("/loginFromServiceToken")
    public AuthenticatedUserDto loginFromServiceToken(@RequestAttribute Long userId,
                                                      @RequestAttribute String serviceToken) throws InstanceNotFoundException {

        User user = userService.loginFromId(userId);

        return toAuthenticatedUserDto(serviceToken, user);

    }




    /**
     * Add image.
     *
     * @param id  the id
     * @param file the file
     * @return the user dto
     * @throws InstanceNotFoundException the instance not found exception
     * @throws IOException the IO exception
     */
    @PutMapping("/addImage/{id}")
    public UserDto addImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws InstanceNotFoundException, IOException {
        User user = userService.addImage(id, file);

        return UserConversor.toUserDto(user);
    }

    /**
     * Change password.
     *
     * @param userId the user id
     * @param id     the id
     * @param params the params
     * @throws PermissionException        the permission exception
     * @throws InstanceNotFoundException  the instance not found exception
     * @throws IncorrectPasswordException the incorrect password exception
     */
    @PostMapping("/{id}/changePassword")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestAttribute Long userId, @PathVariable Long id,
                               @Validated @RequestBody ChangePasswordParamsDto params)
            throws PermissionException, InstanceNotFoundException, IncorrectPasswordException {

        if (!id.equals(userId)) {
            throw new PermissionException();
        }

        userService.changePassword(id, params.getOldPassword(), params.getNewPassword());

    }

    /**
     * Generate service token.
     *
     * @param user the user
     * @return the string
     */
    private String generateServiceToken(User user) {

        JwtInfo jwtInfo = new JwtInfo(user.getId(), user.getEmail(), user.isJournalist());

        return jwtGenerator.generate(jwtInfo);

    }
}
