package es.udc.fic.tfg.utils;

import java.util.HashMap;
import java.util.Map;

public class NationalityIsoMapper {

    private static final Map<String, String> ISO_MAPPING = new HashMap<>();

    static {
        ISO_MAPPING.put("british", "gb");
        ISO_MAPPING.put("german", "de");
        ISO_MAPPING.put("italian", "it");
        ISO_MAPPING.put("french", "fr");
        ISO_MAPPING.put("spanish", "es");
        ISO_MAPPING.put("dutch", "nl");
        ISO_MAPPING.put("finnish", "fi");
        ISO_MAPPING.put("brazilian", "br");
        ISO_MAPPING.put("argentinean", "ar");
        ISO_MAPPING.put("mexican", "mx");
        ISO_MAPPING.put("canadian", "ca");
        ISO_MAPPING.put("austrian", "at");
        ISO_MAPPING.put("australian", "au");
        ISO_MAPPING.put("swiss", "ch");
        ISO_MAPPING.put("belgian", "be");
        ISO_MAPPING.put("swedish", "se");
        ISO_MAPPING.put("portuguese", "pt");
        ISO_MAPPING.put("chilean", "cl");
        ISO_MAPPING.put("american", "us");
        ISO_MAPPING.put("new zealander", "nz");
        ISO_MAPPING.put("irish", "ie");
        ISO_MAPPING.put("south african", "za");
        ISO_MAPPING.put("japanese", "jp");
        ISO_MAPPING.put("russian", "ru");
        ISO_MAPPING.put("polish", "pl");
        ISO_MAPPING.put("venezuelan", "ve");
        ISO_MAPPING.put("colombian", "co");
        ISO_MAPPING.put("czech", "cz");
        ISO_MAPPING.put("hungarian", "hu");
        ISO_MAPPING.put("monegasque", "mc");
        ISO_MAPPING.put("monacan", "mc");
        ISO_MAPPING.put("thai", "th");
        ISO_MAPPING.put("chinese", "cn");
        ISO_MAPPING.put("indian", "in");
        ISO_MAPPING.put("malaysian", "my");
        ISO_MAPPING.put("indonesian", "id");
        ISO_MAPPING.put("dane", "dk");
        ISO_MAPPING.put("danish", "dk");
        ISO_MAPPING.put("estonian", "ee");
        ISO_MAPPING.put("latvian", "lv");
        ISO_MAPPING.put("uruguayan", "uy");
    }

    public static String normalizeNationality(String rawNationality) {
        if (rawNationality == null) return null;
        String lower = rawNationality.trim().toLowerCase();
        return ISO_MAPPING.getOrDefault(lower, lower);
    }
}
