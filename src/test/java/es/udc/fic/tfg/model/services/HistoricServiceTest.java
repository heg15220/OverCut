package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Transactional
class HistoricServiceTest {
    /** The non existent id. */
    private final Long NON_EXISTENT_ID = Long.valueOf(-1);

    /** The category dao. */
    @Autowired
    private CategoryDao categoryDao;

    /** The circuit dao. */
    @Autowired
    private CircuitDao circuitDao;

    /** The podium dao. */
    @Autowired
    private PodiumDao podiumDao;

    /** The historic service. */
    @Autowired
    private HistoricService historicService;

    /**
     * Test InstanceNotFoundException for getCircuits when category does not exist.
     */

    private Circuit createCircuit() {
        return new Circuit(Long.valueOf(2857), Long.valueOf(62), "AstonMartin", null,
                new Category("Circuitos",true,false));
    }


    private Podium createPodium() {
        return new Podium("Alonso","AstonMartin","Verstappen","Hamilton",null,createCircuit());
    }
    @Test
    void testGetCircuitsCategoryDoesNotExist() {
        assertThrows(InstanceNotFoundException.class, () -> historicService.getCircuits(NON_EXISTENT_ID, 0, 2));
    }

    /**
     * Test InstanceNotFoundException for getPodiumsByCircuit when circuit does not exist.
     */
    @Test
    void testGetPodiumsByCircuitCircuitDoesNotExist() {
        assertThrows(InstanceNotFoundException.class, () -> historicService.getPodiumsByCircuit(NON_EXISTENT_ID, 0, 2));
    }

    @Test
    void testGetCircuitDetailsCircuitDoesNotExist() throws InstanceNotFoundException {
        assertThrows(InstanceNotFoundException.class, () -> historicService.getCircuitDetails(NON_EXISTENT_ID));
    }

    @Test
    void testGetPodiumDetailsPodiumDoesNotExist() throws InstanceNotFoundException {
        assertThrows(InstanceNotFoundException.class, () -> historicService.getPodiumDetails(NON_EXISTENT_ID));
    }

    @Test
    void testGetAllCircuits() throws InstanceNotFoundException{
        Circuit circuit = createCircuit();

        Category category = circuit.getCategory();

        categoryDao.save(category);

        circuitDao.save(circuit);

        Block <Circuit> circuits= historicService.getCircuits(category.getId(),0,2);

        List<Circuit> circuitList = circuits.getItems();
        assertNotEquals(0,circuitList.size());
        assertTrue(circuitList.contains(circuit));
        assertTrue(circuitList.size()>1);
    }


    @Test
    void testGetPodiumsByCircuit() throws InstanceNotFoundException{

        Podium podium = createPodium();
        categoryDao.save(podium.getCircuit().getCategory());

        circuitDao.save(podium.getCircuit());

        podiumDao.save(podium);

        Block <Podium> podiums= historicService.getPodiumsByCircuit(podium.getCircuit().getId(),0,2);

        List<Podium> podiumList = podiums.getItems();
        assertNotEquals(0, podiumList.size());
        assertTrue(podiumList.contains(podium));
        assertNotEquals(true,podiumList.size()>1);
    }

    @Test
    void testGetCircuitDetails() throws InstanceNotFoundException{
        Circuit circuit = createCircuit();

        categoryDao.save(circuit.getCategory());
        circuitDao.save(circuit);

        assertNotEquals(null,historicService.getCircuitDetails(circuit.getId()));
    }

    @Test
    void testGetPodiumDetails() throws InstanceNotFoundException{
        Podium podium = createPodium();

        categoryDao.save(podium.getCircuit().getCategory());
        circuitDao.save(podium.getCircuit());
        podiumDao.save(podium);

        assertNotEquals(null,historicService.getPodiumDetails(podium.getId()));
    }

}
