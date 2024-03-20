package es.udc.fic.tfg.model.services.exceptions;

/**
 * The Class PostException.
 */
public class PostException extends Exception{

    private static final long serialVersionUID = -3543929479741725794L;
    /** The name. */
    private final String name;

    /**
     * Instantiates a new post exception
     *
     * @param name the name
     */
    public PostException(String name) {
        super();
        this.name = name;
    }

    /**
     * Gets the name.
     *
     * @return the name
     */
    public String getName() {
        return name;
    }
}
