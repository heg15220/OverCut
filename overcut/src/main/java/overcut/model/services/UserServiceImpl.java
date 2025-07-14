package overcut.model.services;

import jakarta.mail.MessagingException;
import overcut.model.common.exceptions.DuplicateInstanceException;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.*;
import overcut.model.services.exceptions.IncorrectLoginException;
import overcut.model.services.exceptions.IncorrectPasswordException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import overcut.model.services.exceptions.InvalidEmailException;
import overcut.rest.dtos.RankedUserDto;
import overcut.utils.EmailService;
import overcut.utils.EmailSyntaxValidator;
import overcut.utils.UserRank;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.UUID;


/**
 * The Class UserServiceImpl.
 */
@Service
@Transactional
public class UserServiceImpl implements UserService{
    /** The permission checker. */
    @Autowired
    private PermissionChecker permissionChecker;

    /** The password encoder. */
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    /** The user dao. */
    @Autowired
    private UserDao userDao;

    @Autowired
    private AssessmentDao assessmentDao;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private EmailSyntaxValidator emailSyntaxValidator;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserTransactionalHelper transactionalHelper;

    @Autowired
    private PasswordChangeTokenDao passwordChangeTokenDao;



    private void validatePasswordStrength(String password) {
        boolean hasUppercase = password.matches(".*[A-Z].*");
        boolean hasNumber = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[!@#$%^&*(),.?\":{}|<>].*");
        boolean hasLength = password.length() >= 8;

        if (!(hasUppercase && hasNumber && hasSpecial && hasLength)) {
            throw new IllegalArgumentException("Password must contain at least 8 characters, one uppercase letter, one number and one special character.");
        }
    }



    /**
     * Sign up.
     *
     * @param user the user
     * @throws DuplicateInstanceException the duplicate instance exception
     */

    @Override
    public void signUp(User user) throws DuplicateInstanceException, InvalidEmailException {

        if (userDao.existsByUserName(user.getUserName())) {
            throw new DuplicateInstanceException("project.entities.user", user.getUserName());
        }

        if (userDao.existsByEmail(user.getEmail())) {
            throw new DuplicateInstanceException("project.entities.user", user.getEmail());
        }


        validatePasswordStrength(user.getPassword());

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEmailVerified(false);

        System.out.println(">>> Email recibido: '" + user.getEmail() + "'");
        boolean valid = emailSyntaxValidator.isEmailValid(user.getEmail());
        System.out.println(">>> isEmailValid? " + valid);
        if (!valid) {
            throw new InvalidEmailException("Invalid or unverifiable email address");
        }


        // 🧩 Se delega la transacción a otra clase
        transactionalHelper.persistUserAndToken(user);

        if (!user.isAdmin()) {
            try {
                String token = emailVerificationService.getTokenByUser(user); // ya guardado
                emailService.sendConfirmationEmail(user.getEmail(), user.getUserName(), token);
                System.out.println("✉️ Correo de confirmación enviado a " + user.getEmail());
            } catch (Exception e) {
                System.out.println("⚠️ No se pudo enviar el correo de confirmación: " + e.getMessage());
            }
        } else {
            System.out.println("✅ Usuario admin activado automáticamente.");
        }
    }

    /**
     * Login.
     *
     * @param email the user email
     * @param password the password
     * @return the user
     * @throws IncorrectLoginException the incorrect login exception
     */

    @Override
    @Transactional(readOnly = true)
    public User login(String email, String password) throws IncorrectLoginException
    {
        Optional<User> user = userDao.findByEmail(email);

        if (!user.get().isEmailVerified()) {
            throw new IncorrectLoginException("Email not verified.", "email");
        }

        if(user.isEmpty()){
            throw new IncorrectLoginException(email,password);
        }

        if(!passwordEncoder.matches(password,user.get().getPassword())){
            throw new IncorrectLoginException(email,password);
        }
        return user.get();
    }
    /**
     * Login from id.
     *
     * @param id the id
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    @Transactional(readOnly = true)
    public User loginFromId(Long id) throws InstanceNotFoundException {
        return permissionChecker.checkUser(id);
    }

    /**
     * Add image.
     *
     * @param userId the user id
     * @param image  the image
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     * @throws IOException               the IO exception
     */
    @Override
    public User addImage(Long userId, MultipartFile image) throws InstanceNotFoundException, IOException {

        if (image == null) {
            throw new InstanceNotFoundException("User image not found", null);
        }

        User user = userDao.findUserById(userId);
        user.setImage(image.getBytes());

        return user;
    }

    /**
     * Change password.
     *
     * @param id          the id
     * @param oldPassword the old password
     * @param newPassword the new password
     * @throws InstanceNotFoundException  the instance not found exception
     * @throws IncorrectPasswordException the incorrect password exception
     */
    @Override
    public void changePassword(Long id, String oldPassword, String newPassword)
            throws InstanceNotFoundException, IncorrectPasswordException {

        User user = permissionChecker.checkUser(id);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IncorrectPasswordException();
        } else {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

    }

    /**
     * Update profile.
     *
     * @param id        the id
     * @param firstName the first name
     * @param lastName  the last name
     * @param userName  the userName
     * @return the user
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    public User updateProfile(Long id, String userName, String firstName, String lastName)
            throws InstanceNotFoundException {

        User user = permissionChecker.checkUser(id);

        user.setUserName(userName);
        user.setFirstName(firstName);
        user.setLastName(lastName);

        return user;

    }

    @Override
    public int getAmountOfPointsInAllQuiz(Long userId) throws InstanceNotFoundException {
        // Verificar si el usuario existe
        Optional<User> userOptional = userDao.findById(userId);
        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("project,entities,user", userId);
        }

        // Obtener las valoraciones del usuario
        List<Assessment> userAssessments = assessmentDao.findUserAssessmentsByUserId(userId);

        // Calcular la suma total de puntos
        int totalPoints = userAssessments.stream()
                .mapToInt(Assessment::getPoints)
                .sum();

        return totalPoints;
    }

    @Override
    public Map<UserRank, List<RankedUserDto>> getAllUsersGroupedByRank() {
        List<User> allUsers = userDao.findAll();

        return allUsers.stream()
                .filter(u -> u.getPoints() > 0)
                .map(u -> new RankedUserDto(
                        u.getUserName(),
                        u.getPoints(),
                        UserRank.fromPoints(u.getPoints()).name(),
                        u.getImage() // <- añade imagen
                ))
                .collect(Collectors.groupingBy(dto -> UserRank.valueOf(dto.getRank()),
                        TreeMap::new, Collectors.toList()));
    }

    @Override
    public void generatePasswordChangeRequest(Long userId, String oldPassword, String newPassword)
            throws InstanceNotFoundException, IncorrectPasswordException, MessagingException {

        User user = permissionChecker.checkUser(userId);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IncorrectPasswordException();
        }

        String token = UUID.randomUUID().toString();
        PasswordChangeToken entity = new PasswordChangeToken();
        entity.setToken(token);
        entity.setUser(user);
        entity.setExpiration(LocalDateTime.now().plusHours(1));
        entity.setNewPassword(passwordEncoder.encode(newPassword));
        entity.setUsed(false);

        passwordChangeTokenDao.save(entity);
        emailService.sendPasswordChangeEmail(user.getEmail(), user.getUserName(), token);
    }


    @Override
    public void confirmPasswordChange(String token) throws InstanceNotFoundException {
        System.out.println("✅ Entrando a confirmPasswordChange");
        System.out.println("🔑 Token recibido: " + token);

        PasswordChangeToken pct = passwordChangeTokenDao.findByToken(token)
                .orElseThrow(() -> new InstanceNotFoundException("Token not found", token));

        System.out.println("🔐 Token encontrado. isUsed: " + pct.isUsed() + ", expiration: " + pct.getExpiration());
        System.out.println("🕒 Hora actual: " + LocalDateTime.now());

        if (pct.isUsed() || pct.getExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token invalid or expired");
        }

        User user = pct.getUser();
        user.setPassword(pct.getNewPassword());
        pct.setUsed(true);

        userDao.save(user);
        passwordChangeTokenDao.save(pct);
    }

}
