import React from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import InfoIcon from "@mui/icons-material/Info";

const PasswordChangeConfirmationPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={4} sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <InfoIcon sx={{ fontSize: 60, color: "#1976d2", mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            <FormattedMessage
              id="project.users.passwordChangeRequested"
              defaultMessage="We’ve sent a confirmation email to apply your password change."
            />
          </Typography>

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={() => navigate("/")}
          >
            <FormattedMessage
              id="project.global.buttons.backHome"
              defaultMessage="Back to home"
            />
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default PasswordChangeConfirmationPage;
