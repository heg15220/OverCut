package overcut.utils;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import overcut.model.entities.User;
import overcut.model.entities.UserDao;
import overcut.model.services.UserService;
import overcut.model.common.exceptions.DuplicateInstanceException;
import overcut.model.services.exceptions.InvalidEmailException;

@Component
public class InitialUserLoader implements CommandLineRunner {

    @Autowired
    private UserService userService;

    @Autowired
    private UserDao userDao;

    @Override
    public void run(String... args) {
        if (!userDao.existsByEmail("hugo.e@gmx.com")) {
            try {
                User admin = new User();
                admin.setUserName("admin1");
                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setPassword("#EspaGarcia_02");
                admin.setEmail("hugo.e@gmx.com");
                admin.setJournalist(true);
                admin.setAdmin(true);
                admin.setPoints(0);

                userService.signUp(admin);

            } catch (DuplicateInstanceException | InvalidEmailException e) {
                System.out.println("⚠️ Usuario admin1 ya existe o el email no es válido.");
            }
        } else {
            System.out.println(">>> DEBUG: NO se insertó porque ya existía el email hugo.e@gmx.com");

        }
    }
}

