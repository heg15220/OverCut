package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


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

    @Query("SELECT u FROM User u WHERE u.email = ?1")
    Optional<User> findByEmail(String email);


    @Query("SELECT u FROM User u WHERE u.id = ?1")
    User findUserById(Long id);

    // Nuevo método para encontrar los puntos de un usuario por ID
    @Query("SELECT u.points FROM User u WHERE u.id =?1")
    int findUserPointsById(Long id);
}
