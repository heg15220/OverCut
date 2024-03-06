package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.User;

public interface PermissionChecker {
    /**
     * Check user exists.
     *
     * @param userId the user id
     * @throws InstanceNotFoundException the instance not found exception
     */
    public void checkUserExists(Long userId) throws InstanceNotFoundException;

    /**
     * Check user.
     *
     * @param userId the user id
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     */
    public User checkUser(Long userId) throws InstanceNotFoundException;

}
