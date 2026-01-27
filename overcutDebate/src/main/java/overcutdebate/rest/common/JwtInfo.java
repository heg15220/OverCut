package overcutdebate.rest.common;

public class JwtInfo {
    private Long userId;
    private String email;
    private boolean role;   // journalist
    private boolean admin;

    public JwtInfo(Long userId, String email, boolean journalist, boolean admin) {
        this.userId = userId;
        this.email = email;
        this.role = journalist;
        this.admin = admin;
    }

    public Long getUserId() { return userId; }
    public String getEmail() { return email; }
    public boolean isRole() { return role; }
    public boolean isAdmin() { return admin; }
}
