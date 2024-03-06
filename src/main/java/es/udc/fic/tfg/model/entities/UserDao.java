package es.udc.fic.tfg.model.entities;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;

public interface UserDao extends JpaRepository<User, Long> {

    /**
     * Exists by user name.
     *
     * @param userName the user name
     * @return true, if successful
     */
    boolean existsByUserName(String userName);

    boolean existsByEmail(String email);

    /**
     * Find by user name.
     *
     * @param userName the user name
     * @return the optional
     */
    Optional<User> findByUserName(String userName);

    /**
     * Find by user email.
     *
     * @param email the email
     * @return the optional
     */
    Optional<User> findByEmail(String email);

    /**
     * Find by user id.
     *
     * @param id the user id
     * @return the user
     * @throws InstanceNotFoundException
     */
    User findUserById(Long id) throws InstanceNotFoundException;
}
