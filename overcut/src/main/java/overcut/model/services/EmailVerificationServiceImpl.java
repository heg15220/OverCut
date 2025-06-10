package overcut.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.EmailVerificationToken;
import overcut.model.entities.EmailVerificationTokenDao;
import overcut.model.entities.User;
import overcut.model.entities.UserDao;
import java.util.UUID;

import java.time.LocalDateTime;

@Service
public class EmailVerificationServiceImpl implements EmailVerificationService{

    @Autowired
    private EmailVerificationTokenDao tokenDao;

    @Autowired
    private UserDao userDao;

    @Override
    public String generateToken(User user) {
        EmailVerificationToken token = new EmailVerificationToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiration(LocalDateTime.now().plusDays(1));
        tokenDao.save(token);
        return token.getToken();
    }

    @Override
    public String verifyEmail(String token) throws InstanceNotFoundException {
        EmailVerificationToken verificationToken = tokenDao.findByToken(token)
                .orElseThrow(() -> new InstanceNotFoundException("Token not found", token));

        if (verificationToken.getExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token expired");
        }

        User user = verificationToken.getUser();
        userDao.save(user);

        tokenDao.delete(verificationToken);

        return "Email verified.";
    }


}
