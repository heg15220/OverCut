package es.udc.fic.tfg.model.services;

import java.util.List;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * The Class Block.
 *
 * @param <T>
 */
public class Block<T> {
    /** The items */
    private List<T> items;

    /** The exist more items */
    private boolean existMoreItems;

    /**
     * Instantiates a new block.
     *
     * @param items          the items
     * @param existMoreItems the exist more items
     */
    public Block(List<T> items, boolean existMoreItems) {

        this.items = items;
        this.existMoreItems = existMoreItems;

    }

    /**
     * Gets the items.
     *
     * @return the items
     */
    public List<T> getItems() {
        return items;
    }

    /**
     * Gets the exist more items.
     *
     * @return true si existen más elementos, false en caso contrario.
     */
    public boolean getExistMoreItems() {
        return existMoreItems;
    }

    /**
     * The hashCode
     *
     * @return the result
     */
    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + (existMoreItems ? 1231 : 1237);
        result = prime * result + ((items == null) ? 0 : items.hashCode());
        return result;
    }

    /**
     * The equals.
     *
     * @param obj the object
     * @return "true" si los objetos son iguales, "false" en caso contrario.
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        @SuppressWarnings("rawtypes")
        Block other = (Block) obj;
        if (existMoreItems != other.existMoreItems)
            return false;
        if (items == null) {
            if (other.items != null)
                return false;
        } else if (!items.equals(other.items))
            return false;
        return true;
    }

    /**
     * The stream
     *
     * @return the stream
     */
    public Stream<T> stream() {
        return StreamSupport.stream(items.spliterator(), false);
    }

}
