package es.udc.fic.tfg.rest.common;

/**
 * The Class JwtInfo.
 */
public class JwtInfo {
    /** The user id. */
    private Long userId;

    /** The user name. */
    private String email;

    /** The role. */
    private boolean role; // journalist if it is true

    /**
     * Instantiates a new jwt info.
     *
     * @param userId   the user id
     * @param email the user email
     * @param role     the role
     */
    public JwtInfo(Long userId, String email, boolean role) {

        this.userId = userId;
        this.email = email;
        this.role = role;

    }

    /**
     * Gets the user id.
     *
     * @return the user id
     */
    public Long getUserId() {
        return userId;
    }

    /**
     * Sets the user id.
     *
     * @param userId the new user id
     */
    public void setUserId(Long userId) {
        this.userId = userId;
    }

    /**
     * Gets the user email.
     *
     * @return the user email
     */
    public String getEmail() {
        return email;
    }

    /**
     * Sets the user name.
     *
     * @param email the new user email
     */
    public void setEmail(String email) {
        this.email = email;
    }


    /**
     * Gets the role.
     *
     * @return the role
     */

    public boolean isRole() {
        return role;
    }

    /**
     * Sets the role.
     *
     * @param role the new role
     */
    public void setRole(boolean role) {
        this.role = role;
    }






}
