import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";


const ConfirmPasswordChangePage = () => {
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'
  const navigate = useNavigate();

  useEffect(() => {
    const token = window.location.hash.split("token=")[1]?.split("&")[0];
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`http://localhost:8080/overcut/api/users/confirm-password-change?token=${token}`)
      .then((res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      {status === "loading" && <CircularProgress />}
      {status === "success" && (
        <Alert severity="success">
          <Typography variant="h6"><FormattedMessage id="project.users.confirmPasswordChange.success" /></Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate("/")}><FormattedMessage id="project.global.buttons.backHome" /></Button>
        </Alert>
      )}
      {status === "error" && (
        <Alert severity="error">
          <Typography variant="h6"><FormattedMessage id="project.users.confirmPasswordChange.error" /></Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate("/")}><FormattedMessage id="project.global.buttons.backHome" /></Button>
        </Alert>
      )}
    </Box>
  );
};

export default ConfirmPasswordChangePage;
