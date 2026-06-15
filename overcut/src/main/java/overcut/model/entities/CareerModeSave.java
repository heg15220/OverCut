package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class CareerModeSave {

    private Long id;
    private String exportCode;
    private byte[] payload;
    private Integer payloadSize;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CareerModeSave() {
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Column(nullable = false, unique = true, length = 12)
    public String getExportCode() {
        return exportCode;
    }

    public void setExportCode(String exportCode) {
        this.exportCode = exportCode;
    }

    @Lob
    @Column(nullable = false, columnDefinition = "MEDIUMBLOB")
    public byte[] getPayload() {
        return payload;
    }

    public void setPayload(byte[] payload) {
        this.payload = payload;
    }

    @Column(nullable = false)
    public Integer getPayloadSize() {
        return payloadSize;
    }

    public void setPayloadSize(Integer payloadSize) {
        this.payloadSize = payloadSize;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
