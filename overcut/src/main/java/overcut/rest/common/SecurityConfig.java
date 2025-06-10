package overcut.rest.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

/**
 * The Class SecurityConfig.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Método de fábrica para JwtFilter
    @Bean
    public JwtFilter jwtFilter() {
        // Aquí puedes realizar cualquier configuración adicional que necesites para JwtFilter
        return new JwtFilter();
    }


    /**
     * Configure.
     *
     * @param http the http
     * @return the security filter chain
     * @throws Exception the exception
     */
    @Bean
    protected SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.disable()).csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize

                        // 📌 Accesos públicos
                        .requestMatchers(antMatcher("/*")).permitAll()
                        .requestMatchers(antMatcher("/static/**")).permitAll()
                        .requestMatchers(antMatcher("/assets/**")).permitAll()
                        .requestMatchers(antMatcher("/api/users/signUp")).permitAll()
                        .requestMatchers(antMatcher("/api/users/login")).permitAll()
                        .requestMatchers(antMatcher("/api/users/loginFromServiceToken")).permitAll()

                        // 📌 Endpoints de lectura de posts, comentarios, categorías
                        .requestMatchers(antMatcher("/api/posts/getPosts")).permitAll()
                        .requestMatchers(antMatcher("/api/posts/{id}")).permitAll()
                        .requestMatchers(antMatcher("/api/posts/{id}/comments")).permitAll()
                        .requestMatchers(antMatcher("/api/posts/categories")).permitAll()
                        .requestMatchers(antMatcher("/api/posts/new")).permitAll()

                        // 📌 🔐 Endpoints protegidos: solo periodistas pueden crear o editar posts
                        .requestMatchers(antMatcher("/api/posts/")).hasRole("JOURNALIST") // POST (crear)
                        .requestMatchers(antMatcher("/api/posts/{id}")).hasRole("JOURNALIST") // PUT (editar)
                        .requestMatchers(antMatcher("/api/posts/addImage/{id}")).hasRole("JOURNALIST")
                        .requestMatchers(antMatcher("/api/posts/{id}/sections")).hasRole("JOURNALIST") // POST/GET/DELETE se usan para secciones
                        .requestMatchers(antMatcher("/api/posts/user")).hasRole("JOURNALIST")
                        .requestMatchers(antMatcher("/api/posts/{id}/user")).permitAll()

                        // 📌 Comentarios: solo autenticados pueden crear/modificar
                        .requestMatchers(antMatcher("/api/posts/{id}/comment")).authenticated()
                        .requestMatchers(antMatcher("/api/posts/comment/{id}")).authenticated()
                        .requestMatchers(antMatcher("/api/posts/comment/{id}/answer")).authenticated()

                        // 📌 Eventos, histórico y quizzes públicos
                        .requestMatchers(antMatcher("/api/events/**")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/**")).permitAll()
                        .requestMatchers(antMatcher("/api/quiz/**")).permitAll()

                        // 📌 Cualquier otra ruta requiere autenticación
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    /**
     * Authentication manager.
     *
     * @param authenticationConfiguration the authentication configuration
     * @return the authentication manager
     * @throws Exception the exception
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Cors configuration source.
     *
     * @return the cors configuration source
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        config.setAllowCredentials(true);
        config.addAllowedOrigin("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);

        return source;

    }


}