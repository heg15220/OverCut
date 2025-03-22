package es.udc.fic.tfg.model.entities;

public class CircuitApiInfo {
    private String circuitId;
    private String circuitName;
    private String Location;
    private String country;
    private String lat;
    private String lng;
    private String url;

    // Getters y setters
    public String getCircuitId() { return circuitId; }
    public void setCircuitId(String circuitId) { this.circuitId = circuitId; }
    public String getCircuitName() { return circuitName; }
    public void setCircuitName(String circuitName) { this.circuitName = circuitName; }
    public String getLocation() { return Location; }
    public void setLocation(String Location) { this.Location = Location; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getLat() { return lat; }
    public void setLat(String lat) { this.lat = lat; }
    public String getLng() { return lng; }
    public void setLng(String lng) { this.lng = lng; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
