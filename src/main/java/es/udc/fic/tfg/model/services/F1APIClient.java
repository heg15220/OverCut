package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.F1Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class F1APIClient {
    private static final String OPENF1_API = "https://api.openf1.org/v1/";
    private static final String ESPN_API = "https://site.api.espn.com/apis/site/v2/sports/racing/f1/";

    @Autowired
    private RestTemplate restTemplate;

    @Cacheable(value = "f1Data", key = "#type")
    public F1Data getLatestData(String type) {
        String url = type.equals("openf1") ? OPENF1_API + "car_data" : ESPN_API + "scoreboard";
        return restTemplate.getForObject(url, F1Data.class);
    }

    private F1Data processF1Data(String openF1Data, String espnData) {
        // Procesar y combinar datos de ambas APIs
        // Implementar lógica de procesamiento según necesidades específicas
        return new F1Data();
    }
}