package overcut.model.services;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import overcut.model.entities.GpQuestionTemplate;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class RacesGpQuestionCache {

    private final Map<String, List<GpQuestionTemplate>> esByGp = new HashMap<>();
    private final Map<String, List<GpQuestionTemplate>> enByGp = new HashMap<>();
    private final Random rng = new Random();

    @PostConstruct
    public void load() throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        try (InputStream inEs = getClass().getResourceAsStream("/gp_questions_es.json");
             InputStream inEn = getClass().getResourceAsStream("/gp_questions_en.json")) {

            Map<String, List<GpQuestionTemplate>> tmpEs =
                    mapper.readValue(inEs, new TypeReference<>() {});
            Map<String, List<GpQuestionTemplate>> tmpEn =
                    mapper.readValue(inEn, new TypeReference<>() {});

            esByGp.putAll(tmpEs);
            enByGp.putAll(tmpEn);
        }
        System.out.println("[RacesGP] Cargados GPs ES: " + esByGp.size() + ", EN: " + enByGp.size());
    }

    private Map<String, List<GpQuestionTemplate>> getMapForLang(String lang) {
        return "en".equalsIgnoreCase(lang) ? enByGp : esByGp;
    }

    public Set<String> getAvailableGps(String lang) {
        return Collections.unmodifiableSet(getMapForLang(lang).keySet());
    }

    public GpGame pickRandomGame(String lang) {
        Map<String, List<GpQuestionTemplate>> map = getMapForLang(lang);
        List<String> keys = new ArrayList<>(map.keySet());
        if (keys.isEmpty()) {
            throw new IllegalStateException("No hay GPs cargados para lang=" + lang);
        }
        String gp = keys.get(rng.nextInt(keys.size()));
        return buildGameForGp(gp, lang);
    }

    public GpGame buildGameForGp(String gpKey, String lang) {
        Map<String, List<GpQuestionTemplate>> map = getMapForLang(lang);
        List<GpQuestionTemplate> pool = map.get(gpKey);
        if (pool == null || pool.isEmpty()) {
            throw new IllegalArgumentException("GP sin preguntas: " + gpKey + " (" + lang + ")");
        }

        List<GpQuestionTemplate> copy = new ArrayList<>(pool);

        // 1ª fija + resto aleatorio como en Python
        GpQuestionTemplate first = copy.get(0);
        List<GpQuestionTemplate> tail = copy.subList(1, copy.size());

        Collections.shuffle(tail, rng);
        List<GpQuestionTemplate> picked = new ArrayList<>();
        picked.add(first);
        for (int i = 0; i < Math.min(9, tail.size()); i++) {
            picked.add(tail.get(i));
        }

        return new GpGame(gpKey, picked);
    }

    public static class GpGame {
        private final String gpKey;
        private final List<GpQuestionTemplate> questions;

        public GpGame(String gpKey, List<GpQuestionTemplate> questions) {
            this.gpKey = gpKey;
            this.questions = questions;
        }

        public String getGpKey() {
            return gpKey;
        }

        public List<GpQuestionTemplate> getQuestions() {
            return questions;
        }
    }
}
