import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { FormattedMessage } from "react-intl";

const EmailVerificationPage = () => {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const token = hash.split("token=")[1]?.split("&")[0];
    console.log("🪪 Token detectado:", token);

    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`http://localhost:8080/overcut/api/users/verify-email?token=${token}`)
      .then((res) => {
        console.log("📡 Código de respuesta HTTP:", res.status);
        if (res.ok) {
          setStatus("success");
        } else {
          res.text().then((msg) => {
            console.error("❌ Error al verificar:", msg);
            setStatus("error");
          });
        }
      })
      .catch((err) => {
        console.error("❌ Error de red:", err);
        setStatus("error");
      });
  }, []);

  const renderContent = () => {
    if (status === "loading") {
      return (
        <>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            <FormattedMessage
              id="project.emailVerification.loading"
              defaultMessage="Verificando tu cuenta..."
            />
          </Typography>
        </>
      );
    }

    if (status === "success") {
      return (
        <>
          <CheckCircleIcon sx={{ fontSize: 60, color: "green", mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            <FormattedMessage
              id="project.emailVerification.success"
              defaultMessage="¡Tu cuenta ha sido activada correctamente!"
            />
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={() => navigate("/users/login")}
          >
            <FormattedMessage
              id="project.emailVerification.loginButton"
              defaultMessage="Iniciar sesión"
            />
          </Button>
        </>
      );
    }

    if (status === "error") {
      return (
        <>
          <ErrorIcon sx={{ fontSize: 60, color: "red", mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            <FormattedMessage
              id="project.emailVerification.invalidOrExpired"
              defaultMessage="Enlace de verificación no válido o expirado"
            />
          </Typography>
          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 3 }}
            onClick={() => navigate("/")}
          >
            <FormattedMessage
              id="project.emailVerification.goBack"
              defaultMessage="Volver a la página principal"
            />
          </Button>
        </>
      );
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ mt: 10, p: 4, textAlign: "center", borderRadius: 3 }}>
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default EmailVerificationPage;
