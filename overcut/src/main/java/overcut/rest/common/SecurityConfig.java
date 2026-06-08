package overcut.rest.common;

import jakarta.servlet.ServletContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public JwtFilter jwtFilter() {
        return new JwtFilter();
    }

    @Bean
    protected SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Qualifier("mvcHandlerMappingIntrospector") HandlerMappingIntrospector introspector) throws Exception {

        MvcRequestMatcher.Builder mvc = new MvcRequestMatcher.Builder(introspector);

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // ✅ Accesos públicos
                        .requestMatchers(mvc.pattern(HttpMethod.GET, "/api/users/verify-email")).permitAll()
                        .requestMatchers(mvc.pattern(HttpMethod.GET, "/api/users/confirm-password-change")).permitAll()
                        .requestMatchers(mvc.pattern("/api/users/signUp")).permitAll()
                        .requestMatchers(mvc.pattern("/api/users/login")).permitAll()
                        .requestMatchers(mvc.pattern("/api/users/loginFromServiceToken")).permitAll()
                        .requestMatchers(mvc.pattern("/h2-console/**")).permitAll()
                        .requestMatchers(mvc.pattern("/static/**")).permitAll()
                        .requestMatchers(mvc.pattern("/assets/**")).permitAll()

                        // ✅ Posts, eventos y quiz públicos
                        .requestMatchers(mvc.pattern("/api/posts/getPosts")).permitAll()
                        .requestMatchers(mvc.pattern("/api/posts/{id}")).permitAll()
                        .requestMatchers(mvc.pattern("/api/posts/{id}/comments")).permitAll()
                        .requestMatchers(mvc.pattern("/api/posts/categories")).permitAll()
                        .requestMatchers(mvc.pattern("/api/posts/new")).permitAll()
                        .requestMatchers(mvc.pattern("/api/posts/{id}/user")).permitAll()
                        .requestMatchers(mvc.pattern("/api/events/**")).permitAll()
                        .requestMatchers(mvc.pattern("/api/historic/**")).permitAll()
                        .requestMatchers(mvc.pattern("/api/overcutRacing/**")).permitAll()
                        .requestMatchers(mvc.pattern("/api/quiz/**")).permitAll()
                        .requestMatchers(mvc.pattern(HttpMethod.OPTIONS, "/api/consent")).permitAll()
                        .requestMatchers(mvc.pattern(HttpMethod.GET,     "/api/consent")).permitAll()
                        .requestMatchers(mvc.pattern(HttpMethod.PUT,     "/api/consent")).permitAll()

                        // 🔐 Endpoints protegidos
                        .requestMatchers(mvc.pattern("/api/posts/")).hasRole("JOURNALIST")
                        .requestMatchers(mvc.pattern("/api/posts/{id}")).hasRole("JOURNALIST")
                        .requestMatchers(mvc.pattern("/api/posts/addImage/{id}")).hasRole("JOURNALIST")
                        .requestMatchers(mvc.pattern("/api/posts/{id}/sections")).hasRole("JOURNALIST")
                        .requestMatchers(mvc.pattern("/api/posts/user")).hasRole("JOURNALIST")

                        // 🔐 Cualquier otra petición requiere autenticación
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*"); // <-- importante usar esto en Spring Boot 3.x
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.addExposedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 🔧 esto asegura que se aplique a todas las rutas correctamente
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
