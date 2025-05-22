import { FormattedMessage } from 'react-intl';
import AwardsListItem from "./AwardsListItem";

const AwardItems = ({ awards }) => {
    return (
        <div>
            {awards && awards.items.length > 0? (
                <div>
                    {awards.items.map(award =>
                        <AwardsListItem key={award.id} award={award} />
                    )}
                </div>
            ) : <FormattedMessage id="project.no_awards" />}
        </div>
    );
}

export default AwardItems;