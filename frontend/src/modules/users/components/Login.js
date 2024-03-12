import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Errors } from '../../common';
import * as actions from '../actions';

const Login = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [backendErrors, setBackendErrors] = useState(null);

    let form;

    const handleSubmit = event => {
        event.preventDefault();

        if (form.checkValidity()) {

            dispatch(actions.login(
                email.trim(),
                password,
                () => navigate('/'),
                errors => setBackendErrors(errors),
                () => {
                    navigate('/users/login');
                    dispatch(actions.logout());
                }
            ));

        } else {
            setBackendErrors(null);
            form.classList.add('was-validated');
        }
    }


    return (
        <div>
            <div>
                <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                <div className="card bg-light ">
                    <h5 className="card-header text-center"><FormattedMessage id="project.app.Header.login" /></h5>
                    <div className="card-body">
                        <form ref={node => form = node}
                              className="needs-validation" noValidate
                              onSubmit={e => handleSubmit(e)}>
                            <div className="form-group row">
                                <label htmlFor="Email" className="col-md-5 col-form-label">
                                    <FormattedMessage id="project.global.fields.email" />
                                </label>
                                <div className="col-md-12">
                                    <input type="text" id="email" className="form-control"
                                           value={email}
                                           onChange={e => setEmail(e.target.value)}
                                           autoFocus
                                           required />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label htmlFor="password" className="col-md-5 col-form-label">
                                    <FormattedMessage id="project.global.fields.password" />
                                </label>
                                <div className="col-md-12">
                                    <input type="password" id="password" className="form-control"
                                           value={password}
                                           onChange={e => setPassword(e.target.value)}
                                           required />
                                </div>
                            </div>
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

export default Login;