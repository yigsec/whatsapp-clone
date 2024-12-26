// Signup.js
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // const location = useLocation(); // useLocation hook'unu ekleyin

  const handleSignup = async () => {
    try {
      const base_url = process.env.REACT_APP_BASE_URL;
      const url = `http://${base_url}/signup`;

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

      if (response.ok) {
        toast.success("Signup successful!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        // Başarılı kayıt olduktan sonra 2 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          navigate(`/login?username=${username}`); // Kullanıcı adını parametre olarak ekleyin
        }, 2000);
      } else {
        const data = await response.json();
        toast.error(data.detail || "Signup failed.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Signup failed.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div class="bg-light">
      <div class="container vh-100 d-flex justify-content-center align-items-center">
        <div
          class="card shadow-sm p-4"
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <h3 class="text-center mb-4">Kayıt Ol</h3>
          <form>
            <div class="mb-3">
              <label for="username" class="form-label">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                class="form-control"
                id="username"
                placeholder="Kullanıcı adı giriniz..."
              />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                class="form-control"
                id="password"
                placeholder="Şifre Oluşturunuz..."
              />
            </div>
            <button
              type="button"
              class="btn btn-primary w-100"
              onClick={handleSignup}
            >
              Kayıt Ol
            </button>
            <p class="text-center mt-3">
              Hesabınız var mı? <Link to="/login">Giriş Yap</Link>
            </p>
          </form>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
}

export default Signup;
