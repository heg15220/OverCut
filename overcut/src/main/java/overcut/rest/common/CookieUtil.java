package overcut.rest.common;

// overcut.rest.common.CookieUtil
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public class CookieUtil {

    private static boolean isSecure(HttpServletRequest req) {
        // válidas si vas detrás de proxy (Nginx) o en cloud
        String xfp = req.getHeader("X-Forwarded-Proto");
        return req.isSecure() || "https".equalsIgnoreCase(xfp);
    }

    public static void addCookie(HttpServletResponse resp,
                                 String name, String value,
                                 int maxAgeSeconds,
                                 boolean httpOnly,
                                 boolean secure,
                                 String sameSite,   // "None" | "Lax" | "Strict"
                                 String domain,     // null si un solo host
                                 String path) {

        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from(name, value == null ? "" : value)
                .httpOnly(httpOnly)
                .secure(secure)
                .path(path == null ? "/" : path)
                .maxAge(Duration.ofSeconds(maxAgeSeconds));

        if (sameSite != null) b = b.sameSite(sameSite);
        if (domain   != null) b = b.domain(domain);

        resp.addHeader("Set-Cookie", b.build().toString());
    }

    // sobrecarga que SÍ recibe la request y puede decidir Secure:
    public static void addCookie(HttpServletRequest req, HttpServletResponse resp, String name,
                                 String value, int maxAgeSeconds, boolean httpOnly) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setMaxAge(maxAgeSeconds);
        cookie.setHttpOnly(httpOnly);
        cookie.setAttribute("SameSite", "Lax");
        cookie.setSecure(isSecure(req));   // <-- HTTPS solo si toca
        resp.addCookie(cookie);
    }


    public static String readCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (var c : req.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
