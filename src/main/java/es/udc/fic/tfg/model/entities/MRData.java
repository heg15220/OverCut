package es.udc.fic.tfg.model.entities;

public class MRData {
    private DriverTable DriverTable;
    private ConstructorTable ConstructorTable;
    private CircuitTable CircuitTable;

    public DriverTable getDriverTable() {
        return DriverTable;
    }

    public void setDriverTable(DriverTable DriverTable) {
        this.DriverTable = DriverTable;
    }

    public ConstructorTable getConstructorTable() {
        return ConstructorTable;
    }

    public void setConstructorTable(ConstructorTable ConstructorTable) {
        this.ConstructorTable = ConstructorTable;
    }

    public CircuitTable getCircuitTable() {
        return CircuitTable;
    }

    public void setCircuitTable(CircuitTable CircuitTable) {
        this.CircuitTable = CircuitTable;
    }
}
