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

    public void sendConfirmationEmail(String toEmail, String userName) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject("✅ Registro exitoso en OverCut");
        helper.setText(
                "<h2>¡Bienvenido a OverCut, " + userName + "!</h2>" +
                        "<p>Tu cuenta ha sido registrada correctamente. ¡Esperamos que disfrutes la experiencia en nuestra aplicación!</p>",
                true
        );

        mailSender.send(message);
    }
}
