import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import * as userSelectors from '../../users/selectors';
import { Link } from 'react-router-dom';
import './UserDetails.css';
import UserAvatar from '../../users/components/UserAvatar';

const UserDetails = () => {
  const user = useSelector(userSelectors.getUser);

  if (!user) return null;

  return (
    <div className="user-details-page">
      <div className="user-card">
        <div className="user-card-body">
          <div className="user-info">
            <p><span><FormattedMessage id="project.global.fields.userName" />:</span> {user.userName}</p>
            <p><span><FormattedMessage id="project.global.fields.firstName" />:</span> {user.firstName}</p>
            <p><span><FormattedMessage id="project.global.fields.lastName" />:</span> {user.lastName}</p>
            <p><span><FormattedMessage id="project.global.fields.email" />:</span> {user.email}</p>
            <p><span><FormattedMessage id="project.global.fields.points" />:</span> {user.points}</p>
          </div>

          <div className="user-avatar">
            <UserAvatar image={user.image} userName={user.userName} size={150} />
          </div>
        </div>

        <div className="user-card-footer">
          <Link to="/users/update-profile" className="edit-profile-button">
            <FormattedMessage id="project.users.UpdateProfile.title" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
