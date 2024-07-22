package es.udc.fic.tfg.rest.common;

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

        // @formatter:off
        http.cors(cors -> cors.disable()).csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(antMatcher("/*")).permitAll()
                        .requestMatchers(antMatcher("/static/**")).permitAll()
                        .requestMatchers(antMatcher("/assets/**")).permitAll()
                        .requestMatchers(antMatcher("/api/users/signUp")).permitAll()
                        .requestMatchers(antMatcher("/api/users/login")).permitAll()
                        .requestMatchers(antMatcher("/api/users/loginFromServiceToken")).permitAll()
                        .requestMatchers(antMatcher("/api/posts/*")).permitAll()
                        .requestMatchers(antMatcher("/api/posts/postDetails/*")).permitAll()
                        .requestMatchers(antMatcher("/api/posts/*/comments")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/{id}/circuits")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/circuit/{id}/podiums")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/circuits/circuit/{id}")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/circuit/podiums/podium/{id}")).permitAll()
                        .requestMatchers(antMatcher("/api/events/*")).permitAll()
                        .requestMatchers(antMatcher("/api/events/*/notifications")).permitAll()
                        .requestMatchers(antMatcher("/api/events/event/*")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/teams/victories/count")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/circuits/victories/count")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/circuits/{name}/teams/victories")).permitAll()
                        .requestMatchers(antMatcher("/api/historic/circuits/{id}/drivers/victories")).permitAll() // Agrega esta línea
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);
        // @formatter:on

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
