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

        System.out.println("🔍 Token generado: " + token.getToken()); // 👈 AÑADE ESTO

        return token.getToken();
    }


    @Override
    public String verifyEmail(String token) throws InstanceNotFoundException {
        EmailVerificationToken verificationToken = tokenDao.findByToken(token)
                .orElseThrow(() -> new InstanceNotFoundException("Token not found", token));

        User user = verificationToken.getUser();

        // Si ya estaba verificado, simplemente retornar OK
        if (user.isEmailVerified()) {
            return "Email already verified.";
        }

        // Si ha expirado, sigue lanzando error
        if (verificationToken.getExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token expired");
        }

        // Verificar y guardar
        user.setEmailVerified(true);
        userDao.save(user);

        System.out.println("🔍 Token recibido: " + token);
        System.out.println("🧪 Usuario verificado? " + user.isEmailVerified());
        System.out.println("📆 Token expira: " + verificationToken.getExpiration());

        // ❌ No eliminamos el token, para permitir reusarlo (idempotencia)
        // tokenDao.delete(verificationToken);

        return "Email verified.";
    }

    // En EmailVerificationService.java
    @Override
    public String createTokenForUser(User user) {
        String token = UUID.randomUUID().toString();
        EmailVerificationToken entity = new EmailVerificationToken();
        entity.setToken(token);
        entity.setUser(user);
        entity.setExpiration(LocalDateTime.now().plusDays(1));
        tokenDao.save(entity);
        return token;
    }
    @Override
    public String getTokenByUser(User user) {
        return tokenDao.findByUserId(user.getId())
                .map(EmailVerificationToken::getToken)
                .orElseThrow(() -> new RuntimeException("Token not found for user " + user.getId()));
    }






}
