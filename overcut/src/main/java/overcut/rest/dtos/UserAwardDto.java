package overcut.rest.dtos;

import overcut.model.entities.Award;
import overcut.model.entities.User;

public class UserAwardDto {
    private Long id;


    private User user;


    private Award award;

    public UserAwardDto(Long id, User user, Award award) {
        this.id = id;
        this.user = user;
        this.award = award;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Award getAward() {
        return award;
    }

    public void setAward(Award award) {
        this.award = award;
    }
}
