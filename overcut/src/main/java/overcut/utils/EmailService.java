package overcut.utils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendConfirmationEmail(String toEmail, String userName, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject("✅ Registro exitoso en OverCut / Successful Registration at OverCut");

        String confirmationUrl = "http://localhost:3000/#/verify-email?token=" + token;


        String content = "<h2>¡Bienvenido a OverCut, " + userName + "!</h2>" +
                "<p>Tu cuenta ha sido registrada correctamente. Para activar tu cuenta, haz clic en el siguiente botón:</p>" +
                "<a href=\"" + confirmationUrl + "\" " +
                "style=\"display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; " +
                "text-decoration: none; border-radius: 5px;\">Activar cuenta</a>" +
                "<hr>" +
                "<h2>Welcome to OverCut, " + userName + "!</h2>" +
                "<p>Your account has been successfully registered. To activate it, click the button below:</p>" +
                "<a href=\"" + confirmationUrl + "\" " +
                "style=\"display: inline-block; padding: 10px 20px; background-color: #28A745; color: white; " +
                "text-decoration: none; border-radius: 5px;\">Activate Account</a>";

        helper.setText(content, true);
        mailSender.send(message);
    }

}
