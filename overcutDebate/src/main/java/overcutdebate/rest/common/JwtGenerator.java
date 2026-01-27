package overcutdebate.rest.common;

public interface JwtGenerator {
    String generate(JwtInfo info);
    String generate(JwtInfo info, long expirationMinutes);
    JwtInfo getInfo(String token);
}
