import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';

const Pager = ({back, next}) => (

    <nav aria-label="page navigation">
        <ul className="pagination justify-content-center">
            <li className={`page-item ${back.enabled ? "": "disabled"}`}>
                <button className="page-link"
                        onClick={back.onClick}>
                    {back.enabled ? <font color='#9900FF'><FormattedMessage id='project.global.buttons.back' /></font> : <FormattedMessage id='project.global.buttons.back' />}
                </button>
            </li>
            <li className={`page-item ${next.enabled ? "": "disabled"}`}>
                <button className="page-link"
                        onClick={next.onClick}>
                    {next.enabled ? <font color='#9900FF'><FormattedMessage id='project.global.buttons.next' /></font> : <FormattedMessage id='project.global.buttons.next' />}
                </button>
            </li>
        </ul>
    </nav>

);

Pager.propTypes = {
    back: PropTypes.object.isRequired,
    next: PropTypes.object.isRequired
};

export default Pager;