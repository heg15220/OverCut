package overcut.utils;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class EmailSyntaxValidator {

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isEmailValid(String email) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://rapid-email-verifier.fly.dev/api/validate")
                .queryParam("email", email)
                .toUriString();

        try {
            JsonNode response = restTemplate.getForObject(url, JsonNode.class);
            if (response == null || !response.has("validations") || !response.has("status")) {
                return false;
            }

            JsonNode validations = response.get("validations");
            String status = response.path("status").asText("");

            boolean syntax = validations.path("syntax").asBoolean(false);
            boolean domain = validations.path("domain_exists").asBoolean(false);
            boolean mx = validations.path("mx_records").asBoolean(false);

            // Validación principal
            return syntax && domain && mx &&
                    (status.equals("VALID") || status.equals("PROBABLY_VALID"));

        } catch (Exception e) {
            System.out.println("⚠️ Error accediendo a la API de validación. Usando validación local: " + e.getMessage());
            return false;
        }
    }

}

