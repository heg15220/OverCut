package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.User;

public interface EmailVerificationService {
    String generateToken(User user);

    String verifyEmail(String token) throws InstanceNotFoundException;


}
