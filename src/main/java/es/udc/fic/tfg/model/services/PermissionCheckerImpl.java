package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.entities.UserDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * The Class PermissionCheckerImpl.
 */
@Service
@Transactional(readOnly=true)
public class PermissionCheckerImpl implements PermissionChecker{
    /** The user dao. */
    @Autowired
    private UserDao userDao;

    /**
     * Check user exists.
     *
     * @param userId the user id
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    public void checkUserExists(Long userId) throws InstanceNotFoundException {

        if (!userDao.existsById(userId)) {
            throw new InstanceNotFoundException("project.entities.user", userId);
        }

    }

    /**
     * Check user.
     *
     * @param userId the user id
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    public User checkUser(Long userId) throws InstanceNotFoundException {

        Optional<User> user = userDao.findById(userId);

        if (!user.isPresent()) {
            throw new InstanceNotFoundException("project.entities.user", userId);
        }

        return user.get();

    }
}
