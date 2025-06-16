import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import * as userSelectors from '../../users/selectors';
import { Link } from 'react-router-dom';
import './UserDetails.css';

const UserDetails = () => {
  const user = useSelector(userSelectors.getUser);

  if (!user) return null;

  return (
    <div className="user-card">
      <div className="user-card-body">
        <div className="user-info">
          <p><span><FormattedMessage id="project.global.fields.userName" />:</span> {user.userName}</p>
          <p><span><FormattedMessage id="project.global.fields.firstName" />:</span> {user.firstName}</p>
          <p><span><FormattedMessage id="project.global.fields.lastName" />:</span> {user.lastName}</p>
          <p><span><FormattedMessage id="project.global.fields.email" />:</span> {user.email}</p>
          <p><span><FormattedMessage id="project.global.fields.points" />:</span> {user.points}</p>
          <p>
            <span><FormattedMessage id="project.global.fields.journalist" />:</span>
            {user.journalist
              ? <FormattedMessage id="project.global.yes" defaultMessage="Sí" />
              : <FormattedMessage id="project.global.no" defaultMessage="No" />}
          </p>
        </div>

        {user.image && (
          <div className="user-avatar">
            <img
              src={`data:image/jpg;base64,${user.image}`}
              alt="Avatar"
            />
          </div>
        )}
      </div>

      <div className="user-card-footer">
        <Link to="/users/update-profile" className="edit-profile-button">
          <FormattedMessage id="project.users.UpdateProfile.title" />
        </Link>
      </div>
    </div>
  );
};

export default UserDetails;
