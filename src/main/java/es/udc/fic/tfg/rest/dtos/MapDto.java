package es.udc.fic.tfg.rest.dtos;

import java.util.Map;

public class MapDto<K, V> {
    /** The map */
    private Map<K, V> map;

    /** The exist more items */
    private boolean existMoreItems;

    /**
     * Instantiates a new map dto.
     */
    public MapDto() {
    }

    /**
     * Instantiates a new map dto.
     *
     * @param map             the map
     * @param existMoreItems the exist more items
     */
    public MapDto(Map<K, V> map, boolean existMoreItems) {
        this.map = map;
        this.existMoreItems = existMoreItems;
    }

    /**
     * Gets the map.
     *
     * @return the map
     */
    public Map<K, V> getMap() {
        return map;
    }

    /**
     * Sets the map.
     *
     * @param map the map
     */
    public void setMap(Map<K, V> map) {
        this.map = map;
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
     * Sets the exist more items.
     *
     * @param existMoreItems the exist more items
     */
    public void setExistMoreItems(boolean existMoreItems) {
        this.existMoreItems = existMoreItems;
    }
}
