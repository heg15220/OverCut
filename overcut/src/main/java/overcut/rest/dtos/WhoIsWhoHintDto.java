package overcut.rest.dtos;

public class WhoIsWhoHintDto {
    private Long id;
    private int order;
    private String text;

    public WhoIsWhoHintDto() {}
    public WhoIsWhoHintDto(Long id, int order, String text) {
        this.id = id; this.order = order; this.text = text;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
