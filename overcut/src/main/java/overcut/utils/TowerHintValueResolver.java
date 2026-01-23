package overcut.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

public class TowerHintValueResolver {

    private TowerHintValueResolver() {}

    public static String resolve(String themeType, String themeKey, ObjectMapper mapper, EntityManager em) {
        if (themeType == null) return null;

        try {
            switch (themeType) {
                case "champions":
                    return "World Champions";

                case "country":
                    return themeKey; // ya es texto (nationality)

                case "surname_initial":
                    return themeKey; // "A", "B", ...

                case "circuit_winner":
                    // themeKey = circuitRef ("monza", "spa"...)
                    return resolveCircuitNameByRef(themeKey, em);

                case "team":
                    // themeKey = constructorId
                    return resolveConstructorNameById(themeKey, em);

                case "teammates":
                case "champion_teammates":
                    // themeKey = driverId
                    return resolveDriverNameById(themeKey, em);

                case "decade":
                    // themeKey guardado como JSON string: {"code":"1980s","startYear":1980,"endYear":1989}
                    // Aquí devolvemos el code
                    return resolveDecadeCode(themeKey, mapper);

                default:
                    return themeKey;
            }
        } catch (Exception e) {
            // fallback: si hay cualquier problema, no rompemos el hint
            return null;
        }
    }

    private static String resolveDecadeCode(String themeKey, ObjectMapper mapper) throws Exception {
        if (themeKey == null) return null;
        JsonNode n = mapper.readTree(themeKey);
        if (n == null) return null;
        if (n.has("code")) return n.get("code").asText();
        // fallback: si viniese sin code, intentar construir
        if (n.has("startYear") && n.has("endYear")) {
            return n.get("startYear").asText() + "-" + n.get("endYear").asText();
        }
        return null;
    }

    private static String resolveConstructorNameById(String constructorIdStr, EntityManager em) {
        if (constructorIdStr == null) return null;
        long constructorId = Long.parseLong(constructorIdStr);

        Query q = em.createNativeQuery("""
            SELECT c.name
            FROM constructors c
            WHERE c.constructorId = :id
            LIMIT 1
        """);
        q.setParameter("id", constructorId);

        Object r = q.getResultList().stream().findFirst().orElse(null);
        return r != null ? r.toString() : null;
    }

    private static String resolveDriverNameById(String driverIdStr, EntityManager em) {
        if (driverIdStr == null) return null;
        long driverId = Long.parseLong(driverIdStr);

        Query q = em.createNativeQuery("""
            SELECT CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            WHERE d.driverId = :id
            LIMIT 1
        """);
        q.setParameter("id", driverId);

        Object r = q.getResultList().stream().findFirst().orElse(null);
        return r != null ? r.toString() : null;
    }

    private static String resolveCircuitNameByRef(String circuitRef, EntityManager em) {
        if (circuitRef == null) return null;

        Query q = em.createNativeQuery("""
            SELECT c.name
            FROM circuits c
            WHERE c.circuitRef = :ref
            LIMIT 1
        """);
        q.setParameter("ref", circuitRef);

        Object r = q.getResultList().stream().findFirst().orElse(null);
        return r != null ? r.toString() : circuitRef;
    }
}
