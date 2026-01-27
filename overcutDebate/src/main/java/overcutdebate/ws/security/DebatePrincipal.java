package overcutdebate.ws.security;

import java.security.Principal;

public class DebatePrincipal implements Principal {

    private final Long userId;
    private final String email;
    private final boolean admin;
    private final boolean journalist;

    public DebatePrincipal(Long userId, String email, boolean admin, boolean journalist) {
        this.userId = userId;
        this.email = email;
        this.admin = admin;
        this.journalist = journalist;
    }

    @Override
    public String getName() {
        return email; // nombre "principal"
    }

    public Long getUserId() { return userId; }
    public boolean isAdmin() { return admin; }
    public boolean isJournalist() { return journalist; }
}
