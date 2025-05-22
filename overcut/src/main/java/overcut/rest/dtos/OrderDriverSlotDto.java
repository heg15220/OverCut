package overcut.rest.dtos;


public class OrderDriverSlotDto {
    private Long id;
    private Long driverId;
    private String driverName;
    private int correctOrder;

    public OrderDriverSlotDto() {}


    public OrderDriverSlotDto(Long id, Long driverId, String driverName, int correctOrder) {
        this.id = id;
        this.driverId = driverId;
        this.driverName = driverName;
        this.correctOrder = correctOrder;
    }


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public int getCorrectOrder() { return correctOrder; }
    public void setCorrectOrder(int correctOrder) { this.correctOrder = correctOrder; }
}
