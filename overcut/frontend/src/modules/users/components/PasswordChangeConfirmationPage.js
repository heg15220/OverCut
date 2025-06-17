import React from "react";
import { Box, Typography, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";

const PasswordChangeConfirmationPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Alert severity="info">
        <Typography variant="h6">
          <FormattedMessage
            id="project.users.passwordChangeRequested"
            defaultMessage="We’ve sent a confirmation email to apply your password change."
          />
        </Typography>

        <Button sx={{ mt: 2 }} onClick={() => navigate("/")}>
          <FormattedMessage id="project.global.buttons.backHome" defaultMessage="Back to home" />
        </Button>
      </Alert>
    </Box>
  );
};

export default PasswordChangeConfirmationPage;
