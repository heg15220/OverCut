import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, Typography, Container, Paper } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const EmailConfirmationPending = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={4} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            <FormattedMessage id="project.users.EmailConfirmationPending.title" defaultMessage="¡Registro completado!" />
          </Typography>
          <EmailIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            <FormattedMessage
              id="project.users.EmailConfirmationPending.message"
              defaultMessage="Revisa tu correo electrónico y activa tu cuenta desde el enlace recibido para poder iniciar sesión."
            />
          </Typography>
        </Paper>
      </Container>
    </Box>
  );

};

export default EmailConfirmationPending;
