package overcut.utils;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class EmailSyntaxValidator {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final int MAX_RETRIES = 3;
    private static final int RETRY_DELAY_MS = 500;

    public boolean isEmailValid(String email) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://rapid-email-verifier.fly.dev/api/validate")
                .queryParam("email", email)
                .toUriString();

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                JsonNode response = restTemplate.getForObject(url, JsonNode.class);

                if (response == null) {
                    System.out.println("⚠️ [Intento " + attempt + "] Respuesta nula.");
                    continue;
                }

                if (!response.has("validations") || !response.has("status")) {
                    System.out.println("⚠️ [Intento " + attempt + "] Faltan campos en la respuesta: " + response.toPrettyString());
                    continue;
                }

                JsonNode validations = response.get("validations");
                String status = response.path("status").asText("");

                boolean syntax = validations.path("syntax").asBoolean(false);
                boolean domain = validations.path("domain_exists").asBoolean(false);
                boolean mx = validations.path("mx_records").asBoolean(false);

                boolean isValid = syntax && domain && mx &&
                        (status.equals("VALID") || status.equals("PROBABLY_VALID"));

                System.out.println("✅ [Intento " + attempt + "] Resultado validación: " + isValid + " (syntax=" + syntax + ", domain=" + domain + ", mx=" + mx + ", status=" + status + ")");

                if (isValid) {
                    return true;
                }

            } catch (Exception e) {
                System.out.println("❌ [Intento " + attempt + "] Error accediendo a la API: " + e.getMessage());
            }

            // Espera antes del siguiente intento (si no es el último)
            if (attempt < MAX_RETRIES) {
                try {
                    Thread.sleep(RETRY_DELAY_MS);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        System.out.println("❌ Todos los intentos de validación fallaron.");
        return false;
    }
}
