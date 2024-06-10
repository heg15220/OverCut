import CircuitDetailsModal from "./CircuitDetailsModal"; // Asume que este componente existe y muestra los detalles de un circuito
import { FormattedMessage } from 'react-intl';
import {CircuitListItem} from "../index";

const Circuits = ({ circuits }) => {
    return (
        <div>
            {circuits && circuits.items.length > 0? (
                <div>
                    {circuits.items.map(circuit =>
                        <CircuitListItem key={circuit.id} circuit={circuit} />
                    )}
                </div>
            ) : <FormattedMessage id="project.no_posts" />}
        </div>
    );
}

export default Circuits;
