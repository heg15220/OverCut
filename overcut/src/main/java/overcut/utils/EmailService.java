package overcut.utils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.public-base-url:https://overcutf1.com}")
    private String publicBaseUrl;

    public void sendConfirmationEmail(String toEmail, String userName, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom("OverCut <no-reply@overcutf1.com>");

        helper.setTo(toEmail);
        helper.setSubject("✅ Registro exitoso en OverCut / Successful Sign Up at OverCut");

        String confirmationUrl = publicBaseUrl + "/#/verify-email?token=" + token;

        String content = "<h2>Welcome to OverCut, " + userName + "!</h2>" +
                "<p>Your account has been successfully created. To activate it, click the button below:</p>" +
                "<a href=\"" + confirmationUrl + "\" " +
                "style=\"display: inline-block; padding: 10px 20px; background-color: #28A745; color: white; " +
                "text-decoration: none; border-radius: 5px;\">Activate Account</a>" +
                "<hr>" +
                "<h2>¡Bienvenido a OverCut, " + userName + "!</h2>" +
                "<p>Tu cuenta ha sido registrada correctamente. Para activar tu cuenta, haz clic en el siguiente botón:</p>" +
                "<a href=\"" + confirmationUrl + "\" " +
                "style=\"display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; " +
                "text-decoration: none; border-radius: 5px;\">Activar cuenta</a>";


        helper.setText(content, true);
        mailSender.send(message);
    }

    public void sendPasswordChangeEmail(String toEmail, String userName, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom("OverCut <no-reply@overcutf1.com>");

        helper.setTo(toEmail);
        helper.setSubject("🔐 Confirmación de cambio de contraseña / Password Change Confirmation");

        String confirmationUrl = publicBaseUrl + "/#/confirm-password-change?token=" + token;

        String content = "<h2>Hello, " + userName + "</h2>" +
                "<p>You have requested to change your password on OverCut. To confirm and apply the change, click the button below:</p>" +
                "<a href=\"" + confirmationUrl + "\" " +
                "style=\"display: inline-block; padding: 10px 20px; background-color: #17A2B8; color: white; " +
                "text-decoration: none; border-radius: 5px;\">Confirm new password</a>" +
                "<hr>" +
                "<h2>Hola, " + userName + "</h2>" +
                "<p>Has solicitado cambiar tu contraseña en OverCut. Para confirmar y aplicar el cambio, haz clic en el siguiente botón:</p>" +
                "<a href=\"" + confirmationUrl + "\" " +
                "style=\"display: inline-block; padding: 10px 20px; background-color: #FFC107; color: black; " +
                "text-decoration: none; border-radius: 5px;\">Confirmar nueva contraseña</a>";

        helper.setText(content, true);
        mailSender.send(message);
    }
}
