import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { Errors, Success } from '../../common';
import * as actions from '../actions';
import * as selectors from '../selectors';

import image from './Resources/logo2.svg';



const UpdateProfile = () => {

    const user = useSelector(selectors.getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [email, setEmail] = useState(user.email);
    const [backendErrors, setBackendErrors] = useState(null);

    const [completedImage, setCompletedImage] = useState('');

    let form;
    let formImage;
    let srcImage;

    const handleSubmit = event => {

        event.preventDefault();

        if (form.checkValidity()) {

            dispatch(actions.updateProfile(
                {
                    id: user.id,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    //					image: image,
                },
                () => navigate('/'),
                errors => setBackendErrors(errors)));

        } else {

            setBackendErrors(null);
            form.classList.add('was-validated');

        }

    }


    const uploadUserImage = event => {
        event.preventDefault();
        setCompletedImage(null);

        if (formImage.checkValidity()) {
            const formData = new FormData(formImage);
            dispatch(actions.addUserImage(user, formData, () => {
                    setCompletedImage(srcImage);
                },
                errors => setBackendErrors(errors)));
        } else {
            setBackendErrors(null);
            formImage.classList.add('was-validated');
        }


    }

    if (user.image === null) {
        srcImage = image;
    } else {
        srcImage = "data:image/jpg;base64," + user.image;
    }

    return (

        <section className="container d-flex justify-content-center align-items-center min-vh-100" style={{ display: "flex", flex: "column", margin: 200 }}>

            <div className='container d-flex justify-content-center align-items-center min-vh-100'>
                <div className='col-md-10'>
                    <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                    <div className="card bg-light border-dark">
                        <h5 className="card-header text-center">
                            <FormattedMessage id="project.users.UpdateProfile.title" />
                        </h5>
                        <div className="card-body d-flex">
                            <div className='ms-auto'>
                                <form ref={node => form = node}
                                      className="needs-validation" noValidate onSubmit={e => handleSubmit(e)}>
                                    <div className="form-group row py-1">
                                        <label htmlFor="firstName" className="col-md-5 col-form-label">
                                            <FormattedMessage id="project.global.fields.firstName" />
                                        </label>
                                        <div className="col-md-12">
                                            <input type="text" id="firstName" className="form-control"
                                                   value={firstName}
                                                   onChange={e => setFirstName(e.target.value)}
                                                   autoFocus
                                                   required />
                                            <div className="invalid-feedback">
                                                <FormattedMessage id='project.global.validator.required' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group row py-1">
                                        <label htmlFor="lastName" className="col-md-5 col-form-label">
                                            <FormattedMessage id="project.global.fields.lastName" />
                                        </label>
                                        <div className="col-md-12">
                                            <input type="text" id="lastName" className="form-control"
                                                   value={lastName}
                                                   onChange={e => setLastName(e.target.value)}
                                                   required />
                                            <div className="invalid-feedback">
                                                <FormattedMessage id='project.global.validator.required' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group row py-1">
                                        <label htmlFor="email" className="col-md-5 col-form-label">
                                            <FormattedMessage id="project.global.fields.email" />
                                        </label>
                                        <div className="col-md-12">
                                            <input type="email" id="email" className="form-control"
                                                   value={email}
                                                   onChange={e => setEmail(e.target.value)}
                                                   required />
                                            <div className="invalid-feedback">
                                                <FormattedMessage id='project.global.validator.email' />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group py-1 row d-flex justify-content-center">
                                        <div className="text-center mt-3">
                                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }}>
                                                <FormattedMessage id="project.global.buttons.UpdateProfile" />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="vr ms-auto"></div>
                            <div className="ms-4">
                                <div className="">
                                    <div className="" align="center">
                                        <img className="" src={srcImage} alt="Foto " style={{ maxHeight: '350px', maxWidth: '350px' }} />
                                    </div>
                                    <div className="" align="center" style={{ margin: 5 }}>
                                        <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                                        {completedImage &&
                                            <Success message={"project.user.addImage"} onClose={() => { setCompletedImage(null); }} />
                                        }
                                        <p className="card-title text-center" style={{ fontWeight: "bold" }}>
                                            <FormattedMessage id="project.user.userImage.title" />
                                        </p>
                                        <div align="center">
                                            <form ref={node => formImage = node} encType="multipart/form-data" className="needs-validation" noValidate
                                                  onSubmit={(addUserImage) => uploadUserImage(addUserImage)} name="file" method="put">
                                                <div>
                                                    <input type="file" name="file" accept="image/jpeg" id="userPhoto"
                                                           autoFocus
                                                           className="input-sm"
                                                           required></input>
                                                </div>
                                                <div>
                                                    <button type="submit" className="btn btn-secondary m-2">
                                                        <FormattedMessage id="project.global.buttons.save" />
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

}

export default UpdateProfile;
