import CircuitDetailsModal from "./CircuitDetailsModal"; // Asume que este componente existe y muestra los detalles de un circuito
import { FormattedMessage } from 'react-intl';
import {CircuitListItem} from "../index";
import PodiumListItem from "./PodiumListItem";

const Podiums = ({ podiums }) => {
    return (
        <div>
            {podiums && podiums.items.length > 0? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', justifyItems: 'start', border: 'none'  }}>
                    {podiums.items.map(podium =>
                        <PodiumListItem key={podium.id} podium={podium} />
                    )}
                </div>
            ) : <FormattedMessage id="project.no_posts" />}
        </div>
    );
}

export default Podiums;
