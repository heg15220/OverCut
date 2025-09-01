package overcut.rest.dtos;

public class CookieConsentDto {
    private Boolean preferences;
    private Boolean analytics;
    private Boolean ads;
    private String country;
    private Boolean dnt;
    private String tcfString;

    public Boolean getPreferences() {
        return preferences;
    }

    public void setPreferences(Boolean preferences) {
        this.preferences = preferences;
    }

    public Boolean getAnalytics() {
        return analytics;
    }

    public void setAnalytics(Boolean analytics) {
        this.analytics = analytics;
    }

    public Boolean getAds() {
        return ads;
    }

    public void setAds(Boolean ads) {
        this.ads = ads;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public Boolean getDnt() {
        return dnt;
    }

    public void setDnt(Boolean dnt) {
        this.dnt = dnt;
    }

    public String getTcfString() {
        return tcfString;
    }

    public void setTcfString(String tcfString) {
        this.tcfString = tcfString;
    }
}
