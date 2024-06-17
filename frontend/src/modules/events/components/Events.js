import { FormattedMessage } from 'react-intl';
import EventListItem from "./EventListItem";

const Events = ({ events }) => {
    return (
        <div>
            {events && events.items.length > 0? (
                <div>
                    {events.items.map(event =>
                        <EventListItem key={event.id} event={event} />
                    )}
                </div>
            ) : <FormattedMessage id="project.no_posts" />}
        </div>
    );
}

export default Events;