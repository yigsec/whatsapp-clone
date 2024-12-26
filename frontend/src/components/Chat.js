// Chat.js
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Component,
} from "react";
// import { useParams } from 'react-router-dom';
// In your main or entry file (e.g., index.js or App.js)
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

library.add(faPaperPlane);

function Chat() {
  const [selectedUser, setSelectedUser] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const ws = useRef(null);
  const chatboxRef = useRef(null);
  const navigate = useNavigate();
  const currentDate = new Date();
  const [enterMessage, setEnterMessage] = useState("");

  //--------------------------------------------------------------------------------------------------------------------------------

  const startWebSocket = useCallback(() => {
    const accessToken = sessionStorage.getItem("access_token");
    const username = sessionStorage.getItem("username");
    const base_url = process.env.REACT_APP_BASE_URL;
    if (accessToken && username) {
      const socketUrl = `ws://${base_url}/chat/${username}`;

      ws.current = new WebSocket(socketUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connection opened");
      };

      ws.current.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        const eventData = event.data;
        const jsonData = JSON.parse(eventData);

        console.log(jsonData);
        // Gelen mesajı mesajı değerlendir, tipine bak
        if (jsonData.type == "message") {
          const newMessage = {
            id: Date.now(),
            sender: jsonData.content.sender, // Mesaj gelen kişiyi seçtiğimiz kişi olarak ayarla
            message_text: jsonData.content.message,
            sent_at: jsonData.content.sent_at,
          };

          if (selectedUser === newMessage.sender) {
            setMessageHistory((prevHistory) => [...prevHistory, newMessage]);
          }
        }
        // user ile ilgili birşey olduysa değerlendir ve yap
        if (jsonData.type == "user_event") {
          fetchUsers();
          fetchActiveUsers();
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }
  }, [selectedUser, setMessageHistory, ws]);

  const sendMessage = (selectedUser, enterMessage) => {
    // Check if the WebSocket is open
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      selectedUser != ""
    ) {
      const formattedDate = currentDate.toLocaleString();

      // Construct the payload to be sent as JSON
      const payload = {
        receiver: selectedUser,
        message: enterMessage,
        sent_at: formattedDate,
      };
      console.log(payload);

      // Send the payload as a JSON string through the WebSocket
      ws.current.send(JSON.stringify(payload));

      // Gelen mesajı messageHistory'e ekle
      const newMessage = {
        id: Date.now(),
        sender: currentUserName, // Mesaj gelen kişiyi seçtiğimiz kişi olarak ayarla
        message_text: enterMessage,
        sent_at: formattedDate,
      };

      setMessageHistory((prevHistory) => [...prevHistory, newMessage]);
      setEnterMessage("");
    }
  };

  const fetchUsers = async () => {
    try {
      const base_url = process.env.REACT_APP_BASE_URL;
      const url = `http://${base_url}/users`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setTimeout(() => {
          navigate(`/login`);
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error || "Bir hata yaşandı", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });

      setTimeout(() => {
        navigate(`/login`);
      }, 500);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const base_url = process.env.REACT_APP_BASE_URL;
      const url = `http://${base_url}/active_user`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.active_users);
      } else {
        setTimeout(() => {
          navigate(`/login`);
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error || "Bir hata yaşandı", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });
      setTimeout(() => {
        navigate(`/login`);
      }, 500);
    }
  };

  const fetchMessageHistory = async (otherUser) => {
    try {
      const base_url = process.env.REACT_APP_BASE_URL;
      const url = `http://${base_url}/chat/${otherUser}/history`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessageHistory(data.history || []);
      } else {
        setTimeout(() => {
          navigate(`/login`);
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
      toast.error(error || "Bir hata yaşandı", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });
      setTimeout(() => {
        navigate(`/login`);
      }, 500);
    }
  };

  const logout = async () => {
    try {
      const base_url = process.env.REACT_APP_BASE_URL;
      const url = `http://${base_url}/logout`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
      });

      sessionStorage.setItem("access_token", NaN);
      sessionStorage.setItem("username", NaN);

      toast.success("Çıkış başarılı", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });

      setTimeout(() => {
        navigate(`/login`);
      }, 0);
    } catch (error) {
      sessionStorage.setItem("access_token", NaN);
      sessionStorage.setItem("username", NaN);
      toast.success("Çıkış başarılı", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });
      setTimeout(() => {
        navigate(`/login`);
      }, 0);
    }
  };

  //--------------------------------------------------------------------------------------------------------------------------------

  const handleEnterKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Check if there's a selected user and a message to send
      if (selectedUser && enterMessage.trim() !== "") {
        sendMessage(selectedUser, enterMessage);

        // Clear the input field after sending the message
        setEnterMessage("");
      }
    }
  };

  //--------------------------------------------------------------------------------------------------------------------------------

  useEffect(() => {
    // Session storage'dan değeri al
    const access_token = sessionStorage.getItem("access_token"); // access_token'i kendi anahtarınızla değiştirin
    const username = sessionStorage.getItem("username");

    // Eğer değer boşsa, "login" sayfasına yönlendir
    if (!access_token || !username) {
      toast.error("Önce giriş yapınız", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });

      setTimeout(() => {
        navigate(`/login`);
      }, 500);
    }
  }, [navigate]);

  useEffect(() => {
    // Kullanıcı listesini çek
    setCurrentUserName(sessionStorage.getItem("username"));
    fetchUsers();
    fetchActiveUsers();
  }, []);

  useEffect(() => {
    // Kullanıcı değiştikçe yeni kullanıcı ile olan mesaj geçmişini çek
    if (selectedUser) {
      fetchMessageHistory(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    // Scroll to the bottom of the chatbox__row_fullheight element when component mounts or messageHistory changes
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  });

  useEffect(() => {
    // WebSocket bağlantısını başlat

    startWebSocket();
    fetchUsers();
    fetchActiveUsers();

    // Component unmount edildiğinde WebSocket bağlantısını kapat
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [startWebSocket]);

  return (
    <body>
      <div className="container-fluid vh-100">
        <div className="row h-100">
          <div className="col-md-3 col-lg-2 bg-light border-end p-3">
            <div className="d-flex flex-column h-100">
              <div className="mb-4 text-center">
                <h5 className="mb-0">{currentUserName}</h5>
                <small className="text-muted">Çevrimiçi</small>
              </div>
              <div className="mb-4">
                <h6 className="text-muted">Kişiler</h6>
                <ul className="list-group list-group-flush">
                  {users.map((user) => (
                    <li
                      className={`list-group-item d-flex align-items-center ${
                        activeUsers.includes(user) ? "text-success" : ""
                      } ${selectedUser === user ? "bg-secondary" : ""}`}
                      key={user}
                      onClick={() => setSelectedUser(user)}
                    >
                      <span>{user}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto">
                <button
                  className="btn btn-danger w-100"
                  onClick={() => logout()}
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-9 col-lg-10 d-flex flex-column">
            <div className="row bg-primary text-white py-3">
              <div className="col">
                <h4 className="text-center">
                  {selectedUser ? `${selectedUser}` : ""}
                </h4>
              </div>
            </div>
            <div
              className="row flex-grow-1 overflow-auto p-3"
              id="chat-box"
              style={{ backgroundColor: "#f8f9fa" }}
              ref={chatboxRef}
            >
              <div className="col">
                <div className="d-flex flex-column">
                  {messageHistory.map((message) => (
                    <div
                      className={`alert mb-2 w-auto ${
                        message.sender === currentUserName
                          ? "align-self-end alert-secondary"
                          : "align-self-start alert-primary"
                      }`}
                    >
                      {message.message_text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="row py-3">
              <div className="col-10">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Mesaj yazınız..."
                  value={enterMessage}
                  onChange={(e) => setEnterMessage(e.target.value)}
                  onKeyDown={handleEnterKeyDown}
                />
              </div>
              <div className="col-2">
                <button
                  className="btn btn-primary w-100"
                  onClick={() => sendMessage(selectedUser, enterMessage)}
                >
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  );
}

export default Chat;
