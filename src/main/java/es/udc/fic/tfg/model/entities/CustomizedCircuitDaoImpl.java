package es.udc.fic.tfg.model.entities;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

/**
 * The class CustomizedCircuitDaoImpl
 */
public class CustomizedCircuitDaoImpl implements CustomizedCircuitDao {

    /**
     * The entity manager.
     */
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Find all circuits ordered by insertion order.
     *
     * @param page the page
     * @param size the size
     * @return the slice of circuits
     */
    @SuppressWarnings("unchecked")
    @Override
    public Slice<Circuit> findAllCircuitsOrderedByInsertion(int page, int size) {
        String query = "SELECT c FROM Circuit c ORDER BY c.id";
        Query querySentence = entityManager.createQuery(query).setFirstResult(page * size).setMaxResults(size + 1);

        List<Circuit> circuits = querySentence.getResultList();
        boolean hasNextCircuit = circuits.size() == (size + 1);

        if (hasNextCircuit) {
            circuits.remove(circuits.size() - 1);
        }

        return new SliceImpl<>(circuits, PageRequest.of(page, size), hasNextCircuit);
    }
}
