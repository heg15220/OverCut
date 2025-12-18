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

    // === MAP EN -> ES (igual que tu Python, puedes ampliarlo) ===
    private static final Map<String, String> GP_NAME_MAP_EN_ES = Map.ofEntries(

            // 🇬🇧
            Map.entry("Great Britain", "Gran Bretaña"),

            // 🇺🇸
            Map.entry("United States", "Estados Unidos"),

            // 🇲🇽
            Map.entry("Mexico", "México"),

            // 🇧🇪
            Map.entry("Belgium", "Bélgica"),

            // 🇳🇱
            Map.entry("Netherlands", "Países Bajos"),

            // 🇮🇹
            Map.entry("Italy", "Italia"),

            // 🇪🇸
            Map.entry("Spain", "España"),

            // 🇦🇹
            Map.entry("Austria", "Austria"),

            // 🇭🇺
            Map.entry("Hungary", "Hungría"),

            // 🇲🇨
            Map.entry("Monaco", "Mónaco"),

            // 🇨🇦
            Map.entry("Canada", "Canadá"),

            // 🇧🇷
            Map.entry("Brazil", "Brasil"),

            // 🇯🇵
            Map.entry("Japan", "Japón"),

            // 🇨🇳
            Map.entry("China", "China"),

            // 🇶🇦
            Map.entry("Qatar", "Qatar"),

            // 🇸🇦
            Map.entry("Saudi Arabia", "Arabia Saudí"),

            // 🇦🇪
            Map.entry("Abu Dhabi", "Abu Dabi"),

            // 🇦🇿
            Map.entry("Azerbaijan", "Azerbaiyán"),

            // 🇸🇬
            Map.entry("Singapore", "Singapur"),

            // 🇦🇺
            Map.entry("Australia", "Australia"),

            // 🇧🇭
            Map.entry("Bahrain", "Baréin"),

            // 🇫🇷
            Map.entry("France", "Francia"),

            // 🇩🇪
            Map.entry("Germany", "Alemania"),

            // 🇲🇾
            Map.entry("Malaysia", "Malasia"),

            // 🇵🇹
            Map.entry("Portugal", "Portugal"),

            // 🇷🇺
            Map.entry("Russia", "Rusia"),

            // 🇹🇷
            Map.entry("Turkey", "Turquía"),

            // 🇰🇷
            Map.entry("Korea", "Corea"),

            // 🇮🇳
            Map.entry("India", "India"),

            // 🇱🇺
            Map.entry("Luxembourg", "Luxemburgo"),

            // 🇸🇲
            Map.entry("San Marino", "San Marino"),

            // 🌍 GPs especiales
            Map.entry("Europe", "Europa"),
            Map.entry("Pacific", "Pacífico"),

            // 🏁 históricos / únicos
            Map.entry("Eifel", "Eifel"),
            Map.entry("Tuscan", "Toscana"),
            Map.entry("Emilia-Romagna", "Emilia-Romaña"),
            Map.entry("Las Vegas", "Las Vegas"),
            Map.entry("Miami", "Miami"),
            Map.entry("Styria", "Estiria"),
            Map.entry("Anniversary", "Aniversario"),
            Map.entry("Sakhir", "Sakhir"),
            Map.entry("Detroit", "Detroit"),
            Map.entry("Sweden", "Suecia"),
            Map.entry("South Africa", "Sudáfrica")
    );


    private static String normalizeToken(String token) {
        return switch (token) {

            // 🇬🇧 Reino Unido
            case "British" -> "Great Britain";

            // 🇺🇸 EEUU
            case "USA" -> "United States";

            // 🇲🇽 México
            case "Mexican" -> "Mexico";

            // 🇸🇦 Arabia Saudí
            case "Saudi Arabian" -> "Saudi Arabia";

            // 🇦🇿 Azerbaiyán (typo histórico en tus claves)
            case "Azerbaiyan" -> "Azerbaijan";

            // 🇸🇬 Singapur (clave en ES)
            case "Singapur" -> "Singapore";

            // 🇱🇺 Luxemburgo (clave alemana)
            case "Luxemburg" -> "Luxembourg";

            // 🇺🇸 Las Vegas
            case "Vegas" -> "Las Vegas";

            // 🇪🇺 Europa
            case "European" -> "Europe";

            // Por defecto, tal cual
            default -> token;
        };
    }


    private static class Split {
        final String base;
        final String year;   // puede ser null
        final String suffix; // "" o " (v2)" etc.
        Split(String base, String year, String suffix) {
            this.base = base; this.year = year; this.suffix = suffix;
        }
    }

    private static Split splitYearAndSuffix(String raw) {
        String s = raw.trim();

        // sufijo tipo " (v2)"
        String suffix = "";
        if (s.endsWith(")") && s.contains("(")) {
            int i = s.lastIndexOf("(");
            suffix = " " + s.substring(i);     // " (v2)"
            s = s.substring(0, i).trim();      // sin el "(v2)"
        }

        // año final
        String year = null;
        int lastSpace = s.lastIndexOf(' ');
        if (lastSpace > 0) {
            String maybeYear = s.substring(lastSpace + 1);
            if (maybeYear.length() == 4 && maybeYear.chars().allMatch(Character::isDigit)) {
                year = maybeYear;
                s = s.substring(0, lastSpace).trim();
            }
        }

        return new Split(s, year, suffix);
    }

    private static String localizeGpKey(String gpKey, String lang) {
        Split sp = splitYearAndSuffix(gpKey);
        String base = normalizeToken(sp.base);

        String localizedBase = base;
        if ("es".equalsIgnoreCase(lang)) {
            localizedBase = GP_NAME_MAP_EN_ES.getOrDefault(base, base);
        } // en -> lo dejamos tal cual (base en inglés)

        if (sp.year != null) {
            return localizedBase + " " + sp.year + sp.suffix;
        }
        return localizedBase + sp.suffix;
    }

    @PostConstruct
    public void load() throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        try (InputStream inEs = getClass().getResourceAsStream("/gp_questions_es.json");
             InputStream inEn = getClass().getResourceAsStream("/gp_questions_en.json")) {

            if (inEs == null) throw new IllegalStateException("No encuentro /gp_questions_es.json en resources");
            if (inEn == null) throw new IllegalStateException("No encuentro /gp_questions_en.json en resources");

            Map<String, List<GpQuestionTemplate>> tmpEs =
                    mapper.readValue(inEs, new TypeReference<Map<String, List<GpQuestionTemplate>>>() {});
            Map<String, List<GpQuestionTemplate>> tmpEn =
                    mapper.readValue(inEn, new TypeReference<Map<String, List<GpQuestionTemplate>>>() {});

            esByGp.clear();
            enByGp.clear();
            esByGp.putAll(tmpEs);
            enByGp.putAll(tmpEn);
        }

        System.out.println("[RacesGP] Cargados GPs ES: " + esByGp.size() + ", EN: " + enByGp.size());
    }

    private Map<String, List<GpQuestionTemplate>> getMapForLang(String lang) {
        return "en".equalsIgnoreCase(lang) ? enByGp : esByGp;
    }


    public GpGame pickRandomGame(String lang) {
        Map<String, List<GpQuestionTemplate>> map = getMapForLang(lang);
        List<String> keys = new ArrayList<>(map.keySet());
        if (keys.isEmpty()) throw new IllegalStateException("No hay GPs cargados para lang=" + lang);

        String gpKey = keys.get(rng.nextInt(keys.size()));
        return buildGameForGp(gpKey, lang);
    }

    public GpGame buildGameForGp(String gpKey, String lang) {
        Map<String, List<GpQuestionTemplate>> map = getMapForLang(lang);
        List<GpQuestionTemplate> pool = map.get(gpKey);
        if (pool == null || pool.isEmpty()) {
            throw new IllegalArgumentException("GP sin preguntas: " + gpKey + " (" + lang + ")");
        }

        List<GpQuestionTemplate> copy = new ArrayList<>(pool);

        GpQuestionTemplate first = copy.get(0);
        List<GpQuestionTemplate> tail = copy.subList(1, copy.size());

        Collections.shuffle(tail, rng);
        List<GpQuestionTemplate> picked = new ArrayList<>();
        picked.add(first);
        for (int i = 0; i < Math.min(9, tail.size()); i++) picked.add(tail.get(i));

        // ✅ nombre visible localizado
        String displayName = localizeGpKey(gpKey, lang);

        return new GpGame(gpKey, displayName, picked);
    }

    public static class GpGame {
        private final String gpKey;              // clave interna estable
        private final String gpDisplayName;      // ✅ lo que quieres mostrar
        private final List<GpQuestionTemplate> questions;

        public GpGame(String gpKey, String gpDisplayName, List<GpQuestionTemplate> questions) {
            this.gpKey = gpKey;
            this.gpDisplayName = gpDisplayName;
            this.questions = questions;
        }

        public String getGpKey() { return gpKey; }
        public String getGpDisplayName() { return gpDisplayName; }
        public List<GpQuestionTemplate> getQuestions() { return questions; }
    }
}
