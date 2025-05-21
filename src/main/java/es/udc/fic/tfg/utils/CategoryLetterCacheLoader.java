package es.udc.fic.tfg.utils;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;

@Component
public class CategoryLetterCacheLoader {

    private final Map<String, Map<String, Boolean>> esCache = new HashMap<>();
    private final Map<String, Map<String, Boolean>> enCache = new HashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Map<String, Boolean>> getCache(String lang) {
        return lang.equals("en") ? enCache : esCache;
    }

    @PostConstruct
    public void init() {
        loadCache("es", "/scripts/category_letter_cache_es.json");
        loadCache("en", "/scripts/category_letter_cache_en.json");
    }

    private void loadCache(String lang, String path) {
        try (InputStream is = getClass().getResourceAsStream(path)) {
            if (is != null) {
                Map<String, Map<String, Boolean>> cache =
                        objectMapper.readValue(is, new TypeReference<>() {});
                if (lang.equals("es")) {
                    esCache.putAll(cache);
                } else if (lang.equals("en")) {
                    enCache.putAll(cache);
                }
            } else {
                System.err.println("No se encontró el archivo de caché: " + path);
            }
        } catch (Exception e) {
            System.err.println("Error cargando el caché de letras: " + e.getMessage());
        }
    }
}
