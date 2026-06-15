package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.CareerModeSave;
import overcut.model.entities.CareerModeSaveDao;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

@Service
@Transactional
public class CareerModeSaveService {

    private static final int MAX_JSON_BYTES = 256 * 1024;
    private static final int MAX_COMPRESSED_BYTES = 96 * 1024;
    private static final String CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 12;

    private final CareerModeSaveDao saveDao;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public CareerModeSaveService(CareerModeSaveDao saveDao, ObjectMapper objectMapper) {
        this.saveDao = saveDao;
        this.objectMapper = objectMapper;
    }

    public CareerModeSave save(String code, JsonNode state) {
        if (state == null || state.isNull()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing career state");
        }
        byte[] jsonBytes = toJsonBytes(state);
        if (jsonBytes.length > MAX_JSON_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Career state is too large");
        }
        byte[] compressed = gzip(jsonBytes);
        if (compressed.length > MAX_COMPRESSED_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Compressed career state is too large");
        }

        String normalizedCode = normalizeCode(code);
        CareerModeSave save = normalizedCode == null
                ? new CareerModeSave()
                : saveDao.findByExportCode(normalizedCode)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Save code not found"));
        if (normalizedCode == null) {
            save.setExportCode(generateUniqueCode());
        }
        save.setPayload(compressed);
        save.setPayloadSize(compressed.length);
        return saveDao.save(save);
    }

    @Transactional(readOnly = true)
    public CareerModeSave get(String code) {
        String normalizedCode = normalizeCode(code);
        if (normalizedCode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid save code");
        }
        return saveDao.findByExportCode(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Save code not found"));
    }

    public JsonNode readState(CareerModeSave save) {
        try {
            byte[] jsonBytes = gunzip(save.getPayload());
            return objectMapper.readTree(jsonBytes);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stored career state cannot be read");
        }
    }

    private byte[] toJsonBytes(JsonNode state) {
        try {
            return objectMapper.writeValueAsBytes(state);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid career state");
        }
    }

    private byte[] gzip(byte[] input) {
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (GZIPOutputStream gzip = new GZIPOutputStream(output)) {
                gzip.write(input);
            }
            return output.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Career state cannot be compressed");
        }
    }

    private byte[] gunzip(byte[] input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (GZIPInputStream gzip = new GZIPInputStream(new ByteArrayInputStream(input))) {
            gzip.transferTo(output);
        }
        return output.toByteArray();
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalized = code.trim().toUpperCase(Locale.ROOT).replace("-", "");
        if (!normalized.matches("[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid save code");
        }
        return normalized;
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 8; attempt += 1) {
            StringBuilder code = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i += 1) {
                code.append(CODE_ALPHABET.charAt(secureRandom.nextInt(CODE_ALPHABET.length())));
            }
            String candidate = code.toString();
            if (!saveDao.existsByExportCode(candidate)) {
                return candidate;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Save code could not be generated");
    }
}
