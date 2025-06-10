import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button
} from "@mui/material";
import * as userActions from "../../users/actions";
import { isAdmin } from "../../users/selectors";

const CreateJournalistDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    dispatch(userActions.createJournalist(
      formData,
      () => {
        alert("✅ Journalist registered successfully.");
        onClose(); // close modal
      },
      backendErrors => {
        setErrors(backendErrors);
      }
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Journalist</DialogTitle>
      <DialogContent>
        <TextField fullWidth margin="normal" label="Username" name="userName"
          value={formData.userName} onChange={handleChange} required />
        <TextField fullWidth margin="normal" label="First Name" name="firstName"
          value={formData.firstName} onChange={handleChange} required />
        <TextField fullWidth margin="normal" label="Last Name" name="lastName"
          value={formData.lastName} onChange={handleChange} required />
        <TextField fullWidth margin="normal" label="Email" name="email"
          value={formData.email} onChange={handleChange} type="email" required />
        <TextField fullWidth margin="normal" label="Password" name="password"
          value={formData.password} onChange={handleChange} type="password" required />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateJournalistDialog;
