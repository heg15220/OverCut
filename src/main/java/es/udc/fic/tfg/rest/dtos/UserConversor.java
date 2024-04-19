package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.User;

import java.util.List;

/**
 * The Class UserConversor.
 */
public class UserConversor {
    /**
     * Instantiates a new user conversor.
     */
    private UserConversor() {
    }

    /**
     * To user dto.
     *
     * @param user the user
     * @return the user dto
     */
    public static final UserDto toUserDto(User user) {
        return new UserDto(user.getId(), user.getUserName(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getImage(), user.isJournalist(), user.getPoints());

    }

    /**
     * To user. </br>
     * </br>
     * Fix: if more user types are added, change the roletype depending on the
     * userDto.getRole()
     *
     * @param userDto the user dto
     * @return the user
     */
    public static final User toUser(UserDto userDto) {

        return new User(userDto.getUserName(), userDto.getPassword(), userDto.getFirstName(), userDto.getLastName(),
                userDto.getEmail(), userDto.getImage(), userDto.isJournalist(), userDto.getPoints());
    }



    /**
     * Creates a List of commentDtos from a list of comments.
     *
     * @param users the list of Comment
     * @return the corresponding list of CommentDtos
     */
    public static final List<UserDto> toUserDtos(List<User> users) {
        return users.stream().map(UserConversor::toUserDto).toList();
    }


    /**
     * To authenticated user dto.
     *
     * @param serviceToken the service token
     * @param user         the user
     * @return the authenticated user dto
     */
    public static final AuthenticatedUserDto toAuthenticatedUserDto(String serviceToken, User user) {

        return new AuthenticatedUserDto(serviceToken, toUserDto(user));

    }
}
