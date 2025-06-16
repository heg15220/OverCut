import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmailVerificationPage.css"; // crea estilos opcionalmente

const EmailVerificationPage = () => {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash; // "#/verify-email?token=abc-123"
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



  return (
    <div className="email-verification-page">
      {status === "loading" && <p>⏳ Verificando tu cuenta...</p>}
      {status === "success" && (
        <div className="success">
          <h2>✅ ¡Tu cuenta ha sido activada correctamente!</h2>
          <button onClick={() => navigate("/login")}>Iniciar sesión</button>
        </div>
      )}
      {status === "error" && (
        <div className="error">
          <h2>❌ Enlace de verificación no válido o expirado</h2>
          <button onClick={() => navigate("/")}>Ir a la página principal</button>
        </div>
      )}
    </div>
  );
};

export default EmailVerificationPage;
