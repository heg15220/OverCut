package es.udc.fic.tfg.model.entities;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

public class CustomizedPodiumDaoImpl implements CustomizedPodiumDao{

    /**
     * The entity manager.
     */
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Find all podiums associated with a specific circuit.
     *
     * @param circuitId the ID of the circuit
     * @param page the page
     * @param size the size
     * @return the slice of podiums
     */
    @SuppressWarnings("unchecked")
    @Override
    public Slice<Podium> findPodiumsByCircuit(Long circuitId, int page, int size) {
        String query = "SELECT p FROM Podium p JOIN p.circuit c WHERE c.id = :circuitId ORDER BY p.id";
        Query querySentence = entityManager.createQuery(query).setParameter("circuitId", circuitId)
                .setFirstResult(page * size).setMaxResults(size + 1);

        List<Podium> podiums = querySentence.getResultList();
        boolean hasNextPodium = podiums.size() == (size + 1);

        if (hasNextPodium) {
            podiums.remove(podiums.size() - 1);
        }

        return new SliceImpl<>(podiums, PageRequest.of(page, size), hasNextPodium);
    }
}
