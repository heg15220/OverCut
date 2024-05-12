import {CircuitDetailsModal} from "../index";
import {FormattedMessage} from "react-intl";

const Circuits = ({ circuits }) => {
    return (
        <div>
            {circuits && circuits.length > 0? (
                <div>
                    {circuits.map(circuit =>
                        <CircuitDetailsModal key={circuit.circuitId} circuit={circuit} />
                    )}
                </div>
            ) : <FormattedMessage id="project.no_posts" />}
        </div>
    );
}

export default Circuits;
