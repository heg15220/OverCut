import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as userActions from '../../users/actions';
import { isAdmin } from '../../users/selectors';

const CreateJournalistForm = () => {
  const dispatch = useDispatch();
  const admin = useSelector(isAdmin);

  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    dispatch(userActions.createJournalist(
      formData,
      () => alert("Journalist registered successfully."),
      errors => alert("Error: " + JSON.stringify(errors))
    ));
  };

  if (!admin) return null;

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create Journalist</h3>
      <input type="text" name="userName" placeholder="Username" onChange={handleChange} required />
      <input type="text" name="firstName" placeholder="First name" onChange={handleChange} required />
      <input type="text" name="lastName" placeholder="Last name" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <button type="submit">Register Journalist</button>
    </form>
  );
};

export default CreateJournalistForm;
