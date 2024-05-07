import CircuitDetailsModal from "./CircuitDetailsModal"; // Asume que este componente existe y muestra los detalles de un circuito
import { FormattedMessage } from 'react-intl';

const Circuits = ({ circuits }) => {
    return (
        <div>
            {circuits? (
                <div>
                    <div>
                        {circuits.result.items.map(circuit =>
                            <CircuitDetailsModal key={circuit.id} circuit={circuit} />
                        )}
                    </div>
                </div>
            ) : <FormattedMessage id="project.no_circuits" />}
        </div>
    );
}

export default Circuits;
