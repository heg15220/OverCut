package overcut.model.services;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.User;
import overcut.model.entities.UserDao;

@Service
public class UserTransactionalHelper {

    @Autowired
    private UserDao userDao;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Transactional
    public void persistUserAndToken(User user) {
        userDao.save(user);
        if (!user.isAdmin()) {
            emailVerificationService.createTokenForUser(user);
        } else {
            user.setEmailVerified(true);
            userDao.save(user); // asegurar que esté actualizado
        }
    }
}
