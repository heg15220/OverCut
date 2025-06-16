import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button
} from "@mui/material";
import * as userActions from "../../users/actions";

// ✅ Validación de contraseña fuerte
const validatePassword = (password) => {
  const lengthCheck = password.length >= 8;
  const uppercaseCheck = /[A-Z]/.test(password);
  const numberCheck = /\d/.test(password);
  const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    valid: lengthCheck && uppercaseCheck && numberCheck && specialCharCheck,
    lengthCheck,
    uppercaseCheck,
    numberCheck,
    specialCharCheck
  };
};

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
  const [passwordValidation, setPasswordValidation] = useState({
    valid: true,
    lengthCheck: true,
    uppercaseCheck: true,
    numberCheck: true,
    specialCharCheck: true
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordValidation(validatePassword(value));
    }
  };

  const handleSubmit = () => {
    const validation = validatePassword(formData.password);
    if (!validation.valid) {
      setPasswordValidation(validation);
      return;
    }

    dispatch(userActions.createJournalist(
      formData,
      () => {
        alert("✅ Journalist registered successfully.");
        onClose();
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
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          error={!passwordValidation.valid}
          helperText={
            !passwordValidation.valid && (
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'red' }}>
                {!passwordValidation.lengthCheck && <li>At least 8 characters</li>}
                {!passwordValidation.uppercaseCheck && <li>At least one uppercase letter</li>}
                {!passwordValidation.numberCheck && <li>At least one number</li>}
                {!passwordValidation.specialCharCheck && <li>At least one special character</li>}
              </ul>
            )
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateJournalistDialog;
