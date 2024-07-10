import CircuitDetailsModal from "./CircuitDetailsModal";
import { FormattedMessage } from 'react-intl';
import { CircuitListItem } from "../index";

const Circuits = ({ circuits }) => {
    return (
        <div>
            {circuits && circuits.items.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', justifyItems: 'start'}}>
                    {circuits.items.map(circuit =>
                        <CircuitListItem key={circuit.id} circuit={circuit} />
                    )}
                </div>
            ) : <FormattedMessage id="project.no_posts" />}
        </div>
    );
}

export default Circuits;
