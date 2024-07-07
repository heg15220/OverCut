import React, {useEffect} from "react";
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import * as actions from '../../events/actions'
import * as notificationSelector from '../../events/selectors'
import * as selectors from '../../users/selectors';

const Notifications = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectors.getUser);
    const notifications = useSelector(notificationSelector.getAllNotifications);
    const event = useSelector(notificationSelector.getEventDetails);

    return (
        <li className="nav-item dropdown">
            <button className="dropdown-toggle nav-link" style={{ color: '#9900FF' }} type="button" data-bs-toggle="dropdown"
                    onClick={() => {
                        dispatch(actions.getNotificationsForUser(user.id, 0,() => {}, () => {}))
                    }}>
                <FormattedMessage id="project.common.notifications.button" />
            </button>

            <div className="dropdown-menu">
                {notifications && notifications.length !== 0? (
                    notifications.items.map(notification => (
                        <div key={notification.id}>
                            <div className="d-flex">
                                <Link className="dropdown-item" to={`/event/event-details/${notification.eventId}`}>
                                    <div>
                                        <div className="ms-2">{notification.message}</div>
                                        <div className="ms-2">{new Date(notification.date).toLocaleDateString('default', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}</div>
                                    </div>
                                </Link>
                                <button className="btn" onClick={() => {
                                    dispatch(actions.markAsRead(notification.id, user.id, () => {}, () => {}))
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" color="red" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                                        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="dropdown-item disabled">You don't have notifications</div>
                )}
            </div>
        </li>
    );
};

export default Notifications;
