// Login.js
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const location = useLocation();
  const history = useNavigate(); // useNavigate hook'unu ekleyin

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const usernameParam = searchParams.get("username");
    const accessTokenParam = searchParams.get("accessToken");

    // Parametrede kullanıcı adı ve erişim tokeni varsa ayarlayın
    setUsername(usernameParam || "");
    setAccessToken(accessTokenParam || "");
  }, [location.search]);

  const handleLogin = async () => {
    try {
      const base_url = process.env.REACT_APP_BASE_URL;
      const url = `http://${base_url}/login`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.status === 401) {
        toast.error("Kullanıcı adı veya şifre yanlış", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      }

      const data = await response.json();

      // Kullanıcı adı ve erişim tokeni bilgilerini kaydet
      setUsername(data.user_name);
      setAccessToken(data.access_token);
      sessionStorage.setItem("username", data.user_name);
      sessionStorage.setItem("access_token", data.access_token);
      // Başarılı giriş işlemi sonrasında "chat" sayfasına yönlendir
      history("/chat");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="login-container">
      <body className="bg-light">
        <div className="container vh-100 d-flex justify-content-center align-items-center">
          <div
            className="card shadow-sm p-4"
            style={{ width: "100%", maxWidth: "400px" }}
          >
            <h3 className="text-center mb-4">Giriş Yap</h3>
            <form>
              <div className="mb-3">
                <label for="name" className="form-label">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Adınızı giriniz..."
                />
              </div>
              <div className="mb-3">
                <label for="password" className="form-label">
                  Şifre
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  id="password"
                  placeholder="Şifrenizi giriniz..."
                ></input>
              </div>
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={handleLogin}
              >
                Giriş Yap
              </button>
              <p className="text-center mt-3">
                Hesabınız yok mu? <Link to="/signup">Kayıt Ol</Link>
              </p>
            </form>
          </div>
        </div>
      </body>
      <ToastContainer />
      <form className="login-form"></form>
      {/* Eğer accessToken varsa, göster */}
      {accessToken && <p>Erişim Tokeni: {accessToken}</p>}
    </div>
  );
}

export default Login;
