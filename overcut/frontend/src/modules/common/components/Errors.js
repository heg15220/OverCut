import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

const Errors = ({ errors, onClose }) => {

    const intl = useIntl();

    if (!errors) {
        return null;
    }

    let globalError;
    let fieldErrors;

    if (errors.globalError) {
        globalError = errors.globalError;
    } else if (errors.fieldErrors) {
        fieldErrors = [];
        let num = 0;
        errors.fieldErrors.forEach(e => {
            let fieldName = intl.formatMessage({ id: `project.global.fields.${e.fieldName}` });
            fieldErrors.push({ identifier: num, error: `${fieldName}: ${e.message}` })
        });

    }

    return (

        <div id="error" className="alert alert-danger alert-dismissible fade show" role="alert">

            {globalError ? globalError : ''}

            {fieldErrors ?
                <ul>
                    {fieldErrors.map((fieldError) =>
                        <li key={fieldError.identifier}>{fieldError.error}</li>
                    )}
                </ul>
                :
                ''
            }

            <button type="button" className="close" data-dismiss="alert" aria-label="Close"
                    onClick={() => onClose()}>
                <span aria-hidden="true">&times;</span>
            </button>

        </div>

    );

}

Errors.propTypes = {
    errors: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    onClose: PropTypes.func.isRequired
};

export default Errors;
