import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { Errors } from '../../common';
import * as actions from '../actions';

import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

const SignUp = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [backendErrors, setBackendErrors] = useState(null);
    const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState(false);
    const [journalist, setJournalist] = useState(false);
    let form;
    let confirmPasswordInput;

    const handleSubmit = event => {

        event.preventDefault();

        if (form.checkValidity() && checkConfirmPassword()) {

            dispatch(actions.signUp(
                {
                    userName: userName.trim(),
                    password: password,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    journalist: journalist
                },
                () => navigate('/'),
                errors => setBackendErrors(errors),
                () => {
                    navigate('/');
                    dispatch(actions.logout());
                }
            ));

        } else {

            setBackendErrors(null);
            form.classList.add('was-validated');

        }

    }

    const checkConfirmPassword = () => {

        if (password !== confirmPassword) {

            confirmPasswordInput.setCustomValidity('error');
            setPasswordsDoNotMatch(true);

            return false;

        } else {
            return true;
        }

    }

    const handleConfirmPasswordChange = value => {

        confirmPasswordInput.setCustomValidity('');
        setConfirmPassword(value);
        setPasswordsDoNotMatch(false);

    }

    return (
        <div className="">
            <div>
                <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />

                <div className="card bg-light ">
                    <h5 className="card-header text-center">
                        <FormattedMessage id="project.users.SignUp.title" />
                    </h5>
                    <div className="card-body">
                        <form ref={node => form = node}
                              className="needs-validation" noValidate
                              onSubmit={e => handleSubmit(e)}>
                            <div className="form-group row">
                                <label htmlFor="userName" className="col-md- col-form-label">
                                    <FormattedMessage id="project.global.fields.userName" />
                                </label>
                                <div className="col-md-12">
                                    <input type="text" id="userName" className="form-control"
                                           value={userName}
                                           onChange={e => setUserName(e.target.value)}
                                           autoFocus
                                           required />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label htmlFor="password" className="col-md- col-form-label">
                                    <FormattedMessage id="project.global.fields.password" />
                                </label>
                                <div className="col-md-12">
                                    <input type="password" id="password" className="form-control"
                                           value={password}
                                           onChange={e => setPassword(e.target.value)}
                                           required />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label htmlFor="confirmPassword" className="col-md- col-form-label">
                                    <FormattedMessage id="project.users.SignUp.fields.confirmPassword" />
                                </label>
                                <div className="col-md-12">
                                    <input ref={node => confirmPasswordInput = node}
                                           type="password" id="confirmPassword" className="form-control"
                                           value={confirmPassword}
                                           onChange={e => handleConfirmPasswordChange(e.target.value)}
                                           required />
                                    <div className="invalid-feedback">
                                        {passwordsDoNotMatch ?
                                            <FormattedMessage id='project.global.validator.passwordsDoNotMatch' /> :
                                            <FormattedMessage id='project.global.validator.required' />}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group row">
                                <label htmlFor="firstName" className="col-md- col-form-label">
                                    <FormattedMessage id="project.global.fields.firstName" />
                                </label>
                                <div className="col-md-12">
                                    <input type="text" id="firstName" className="form-control"
                                           value={firstName}
                                           onChange={e => setFirstName(e.target.value)}
                                           required />
                                    <div className="invalid-feedback">
                                        <FormattedMessage id='project.global.validator.required' />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group row">
                                <label htmlFor="lastName" className="col-md- col-form-label">
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
                            <div className="form-group row">
                                <label htmlFor="email" className="col-md- col-form-label">
                                    <FormattedMessage id='project.global.fields.email' />
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

                            <FormGroup>
                                <FormControlLabel
                                    control={<Checkbox checked={journalist} onChange={(e) => setJournalist(e.target.checked)} />}
                                    label="Soy periodista"
                                />
                            </FormGroup>

                            <div className="p-2">
                                <div className="col-md-2 mx-auto">
                                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#9900FF', borderColor: '#9900FF' }}>
                                        <FormattedMessage id="project.global.buttons.save" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default SignUp;