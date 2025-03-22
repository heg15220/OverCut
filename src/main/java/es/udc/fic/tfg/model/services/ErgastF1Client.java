package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ErgastF1Client {
    private final RestTemplate restTemplate;

    @Autowired
    public ErgastF1Client(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Driver getDriverInfo(String driverId) {
        String url = "http://ergast.com/api/f1/drivers/{driverId}.json";
        ResponseEntity<DriverResponse> response = restTemplate.getForEntity(url, DriverResponse.class, driverId);

        if (response.getBody() == null || response.getBody().getMRData() == null) {
            throw new RuntimeException("No se obtuvieron datos del piloto para el ID: " + driverId);
        }

        return response.getBody().getMRData().getDriverTable().getDrivers().get(0);
    }

    public Constructor getTeamInfo(String teamId) {
        String url = "http://ergast.com/api/f1/constructors/{teamId}.json";
        ResponseEntity<TeamResponse> response = restTemplate.getForEntity(url, TeamResponse.class, teamId);

        if (response.getBody() == null || response.getBody().getMRData() == null) {
            throw new RuntimeException("No se obtuvieron datos del equipo para el ID: " + teamId);
        }

        return response.getBody().getMRData().getConstructorTable().getConstructors().get(0);
    }

    public CircuitApiInfo getCircuitInfo(String circuitId) {
        String url = "http://ergast.com/api/f1/circuits/{circuitId}.json";
        ResponseEntity<CircuitResponse> response = restTemplate.getForEntity(url, CircuitResponse.class, circuitId);

        if (response.getBody() == null || response.getBody().getMRData() == null) {
            throw new RuntimeException("No se obtuvieron datos del circuito para el ID: " + circuitId);
        }

        return response.getBody().getMRData().getCircuitTable().getCircuits().get(0);
    }
}
