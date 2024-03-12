import { FormattedMessage} from 'react-intl';
import { useSelector} from 'react-redux';
import * as userSelectors from '../../users/selectors';
import { Link } from 'react-router-dom';



const UserDetails = () => {
    const user = useSelector(userSelectors.getUser);



    if (!user) {
        return null;
    }

    return (
        <div className="card " >
            <div className="card-header">
                <h5 className="card-title text-center  bg-light" id="titulo">
                    <FormattedMessage id="project.users.Profile.title" />
                </h5>
            </div>

            <div className="card-body d-flex">
                <div className="p-2 text-start ms-2 ">
                    <div className="justform-group row">
                        <label htmlFor="userName" className="col-md- col-form-label">
                            <FormattedMessage id="project.global.fields.userName" /> : {user.userName}
                        </label>

                    </div>

                    <div className="form-group row">
                        <label htmlFor="description" className="col-md- col-form-label">
                            <FormattedMessage id="project.global.fields.firstName" /> : {user.firstName}
                        </label>
                    </div>
                    <div className="col-md-12 form-group">
                        <label htmlFor="description" className="col-md- col-form-label">
                            <FormattedMessage id="project.global.fields.lastName" /> : {user.lastName}
                        </label>
                    </div>

                    <div className="form-group row">
                        <label htmlFor="price" className="col-md- col-form-label">
                            <FormattedMessage id='project.global.fields.email' /> : {user.email}
                        </label>
                    </div>

                </div>

                {user.image && <div class="vr ms-4"></div>}
                <div className="ms-4">
                    {user.image && <img src={"data:image/jpg;base64," + user.image} class="rounded-circle m-2" width="250px" height="250px" alt="Avatar" />}

                </div>
            </div>
            <div className='text-center'>
                <button type="submit p-2" className="btn btn-primary my-2" id="modify post" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }}>
                    <Link className="dropdown-item" to="/users/update-profile">
                        <FormattedMessage id="project.users.UpdateProfile.title" />
                    </Link>
                </button>
            </div>
        </div>
    );
};
export default UserDetails;