package overcut.utils;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import overcut.model.entities.User;
import overcut.model.entities.UserDao;
import overcut.model.services.UserService;
import overcut.model.common.exceptions.DuplicateInstanceException;
import overcut.model.services.exceptions.InvalidEmailException;

@Component
@Profile("!test")
public class InitialUserLoader implements CommandLineRunner {

    @Autowired
    private UserService userService;

    @Autowired
    private UserDao userDao;

    @Value("${seed.admin.enabled:false}")
    private boolean seedAdminEnabled;

    @Override
    public void run(String... args) {
        if (seedAdminEnabled && !userDao.existsByEmail("hugo.e@gmx.com")) {
            User admin = new User();
            admin.setUserName("admin1");
            admin.setFirstName("OverCut");
            admin.setLastName("Admin");
            admin.setPassword("#EspaGarcia_02");
            admin.setEmail("hugo.e@gmx.com");
            admin.setJournalist(true);
            admin.setAdmin(true);
            admin.setPoints(0);

            // Crear sin pasar por signUp (evita email y validación externa)
            // Asegúrate de encodar la password y marcar verificado:
            admin.setPassword(new BCryptPasswordEncoder().encode(admin.getPassword()));
            admin.setEmailVerified(true);
            userDao.save(admin);

        } else {
            System.out.println(">>> DEBUG: NO se insertó porque ya existía el email hugo.e@gmx.com");

        }
    }
}

