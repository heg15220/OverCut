import { FormattedMessage } from 'react-intl';
import AwardsListItem from "./AwardsListItem";
import AwardsUserListItem from "./AwardsUserListItem";

const AwardsUserItems = ({ awards }) => {
    return (
        <div>
            {awards && awards.items.length > 0? (
                <div>
                    {awards.items.map(award =>
                        <AwardsUserListItem key={award.id} award={award} />
                    )}
                </div>
            ) : <FormattedMessage id="project.no_awards" />}
        </div>
    );
}

export default AwardsUserItems;