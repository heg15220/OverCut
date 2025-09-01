package overcut.rest.common;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class AnalyticsConsentFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        String path = req.getRequestURI();
        if (path.startsWith("/api/track/")) {
            String consent = readCookie(req, "oc_consent");
            boolean analytics = consent != null && consent.contains("A1");
            if (!analytics) {
                ((HttpServletResponse) response).setStatus(HttpServletResponse.SC_FORBIDDEN);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private String readCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (var c : req.getCookies()) if (name.equals(c.getName())) return c.getValue();
        return null;
    }
}
