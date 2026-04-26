//import { useState } from "react";
import { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const quizQuestions = [
  {
    question: "Is public Wi-Fi safe for online banking?",
    options: ["Yes", "No"],
    answer: "No",
  },
  {
    question: "What is phishing?",
    options: [
      "A scam to steal sensitive information",
      "A type of antivirus",
      "A safe payment method",
    ],
    answer: "A scam to steal sensitive information",
  },
  {
    question: "What does 2FA mean?",
    options: [
      "Two-Factor Authentication",
      "Two File Access",
      "Fast Financial Approval",
    ],
    answer: "Two-Factor Authentication",
  },
  {
    question: "Which password is strongest?",
    options: ["12345678", "password123", "Market#Safe2026"],
    answer: "Market#Safe2026",
  },
  {
    question: "What should you do before clicking a suspicious link?",
    options: ["Click quickly", "Verify the sender/source", "Forward it to everyone"],
    answer: "Verify the sender/source",
  },
];

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState(null);

  const [passwordCheck, setPasswordCheck] = useState("");
  const [passwordResult, setPasswordResult] = useState("");

  const [phishingText, setPhishingText] = useState("");
  const [phishingResult, setPhishingResult] = useState("");

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [auditScore, setAuditScore] = useState(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
  name: "",
  phone: "",
  business_name: "",
  business_description: "",
  residency: "",
  emergency_contact: "",
  profile_photo: ""
});

useEffect(() => {
  async function autoLogin() {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (res.ok) {
          setDashboard(data);
          setIsLoggedIn(true);

          if (data.user) {
            setProfileForm({
              name: data.user.name || "",
              phone: data.user.phone || "",
              business_name: data.user.business_name || "",
              business_description: data.user.business_description || "",
              residency: data.user.residency || "",
              emergency_contact: data.user.emergency_contact || "",
              profile_photo: data.user.profile_photo || ""
            });
          }
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        localStorage.removeItem("token");
      }
    }
  }

  autoLogin();
}, []);

useEffect(() => {
  function refreshWhenFocused() {
    const token = localStorage.getItem("token");

    if (token && isLoggedIn) {
      loadDashboard();
    }
  }

  window.addEventListener("focus", refreshWhenFocused);

  return () => {
    window.removeEventListener("focus", refreshWhenFocused);
  };
}, [isLoggedIn]);

  async function handleAuth(e) {
    e.preventDefault();

    const url = isLogin
      ? `${API_URL}/api/login`
      : `${API_URL}/api/register`;

    const body = isLogin ? { email, password } : { name, email, password };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.token) {
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      await loadDashboard();
    }
  }

  async function loadDashboard() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setDashboard(data);

    if (data.user) {
  setProfileForm({
    name: data.user.name || "",
    phone: data.user.phone || "",
    business_name: data.user.business_name || "",
    business_description: data.user.business_description || "",
    residency: data.user.residency || "",
    emergency_contact: data.user.emergency_contact || "",
    profile_photo: data.user.profile_photo || ""
  });
}
  }

  async function updateProfile(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileForm)
  });

  const data = await res.json();

  setMessage(data.message);

  await loadDashboard();
}

  function checkPasswordStrength() {
    let score = 0;

    if (passwordCheck.length >= 12) score++;
    if (/[A-Z]/.test(passwordCheck)) score++;
    if (/[a-z]/.test(passwordCheck)) score++;
    if (/[0-9]/.test(passwordCheck)) score++;
    if (/[^A-Za-z0-9]/.test(passwordCheck)) score++;

    if (score <= 2) {
      setPasswordResult("Weak password — improve length, symbols, and numbers.");
    } else if (score <= 4) {
      setPasswordResult("Medium password — good, but can be stronger.");
    } else {
      setPasswordResult("Strong password — good security level.");
    }
  }

  function detectPhishing() {
    const text = phishingText.toLowerCase();

    const dangerWords = [
      "urgent",
      "verify",
      "blocked",
      "password",
      "otp",
      "click",
      "login",
      "bank",
      "prize",
      "winner",
      "account suspended",
    ];

    const found = dangerWords.filter((word) => text.includes(word));
    const hasLink =
      text.includes("http") || text.includes("www") || text.includes(".com");

    if (found.length >= 3 || hasLink) {
      setPhishingResult("High Risk: This message looks suspicious. Do not click links.");
    } else if (found.length > 0) {
      setPhishingResult("Medium Risk: Be careful and verify the sender.");
    } else {
      setPhishingResult("Low Risk: No major warning signs detected.");
    }
  }

  async function submitQuiz() {
    let score = 0;

    quizQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        score++;
      }
    });

    setQuizScore(score);

    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/api/quiz-results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        score,
        total: quizQuestions.length,
      }),
    });

    await loadDashboard();
  }

  async function submitAudit() {
    const checks = document.querySelectorAll(".audit-check");
    let checked = 0;

    checks.forEach((item) => {
      if (item.checked) checked++;
    });

    const score = Math.round((checked / checks.length) * 100);
    setAuditScore(score);

    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/api/audit-results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ score }),
    });

    await loadDashboard();
  }

  function logout() {
  setShowLogoutModal(true);
}

function confirmLogout() {
  localStorage.removeItem("token");
  setIsLoggedIn(false);
  setDashboard(null);
  setShowUserMenu(false);
  setShowLogoutModal(false);
  setMessage("Logged out successfully");
}

function cancelLogout() {
  setShowLogoutModal(false);
}

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Cyber Safety Toolkit</h1>
          <h2>{isLogin ? "Login" : "Register"}</h2>

          <form onSubmit={handleAuth}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button>{isLogin ? "Login" : "Register"}</button>
          </form>

          <p
            className="switch-link"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
          >
            {isLogin ? "Need an account? Register" : "Already have account? Login"}
          </p>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className={sidebarCollapsed ? "sidebar collapsed" : "sidebar"}>
  <h2>{sidebarCollapsed ? "CT" : "Cyber Toolkit"}</h2>

  <button
    className={activeSection === "dashboard" ? "active-nav" : ""}
    onClick={() => setActiveSection("dashboard")}
  >
    {sidebarCollapsed ? "🏠" : "Dashboard"}
  </button>

  <button
    className={activeSection === "password" ? "active-nav" : ""}
    onClick={() => setActiveSection("password")}
  >
    {sidebarCollapsed ? "🔐" : "Password Checker"}
  </button>

  <button
    className={activeSection === "phishing" ? "active-nav" : ""}
    onClick={() => setActiveSection("phishing")}
  >
    {sidebarCollapsed ? "🎣" : "Phishing Detector"}
  </button>

  <button
    className={activeSection === "quiz" ? "active-nav" : ""}
    onClick={() => setActiveSection("quiz")}
  >
    {sidebarCollapsed ? "🧠" : "Awareness Quiz"}
  </button>

  <button
    className={activeSection === "audit" ? "active-nav" : ""}
    onClick={() => setActiveSection("audit")}
  >
    {sidebarCollapsed ? "🛡️" : "Security Audit"}
  </button>

  <button
    className={activeSection === "profile" ? "active-nav" : ""}
    onClick={() => setActiveSection("profile")}
  >
    {sidebarCollapsed ? "👤" : "Profile"}
  </button>

  <button className="logout-btn" onClick={logout}>
    {sidebarCollapsed ? "⏻" : "Logout"}
  </button>
</aside>

      <main className={sidebarCollapsed ? "main-content expanded" : "main-content"}>
        <div className="app-header">
          <button
            className="menu-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            ☰
          </button>

          <div className="user-area">
            <div
              className="user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {dashboard?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {showUserMenu && (
              <div className="user-menu">
                <strong>{dashboard?.user?.name}</strong>
                <p>{dashboard?.user?.email}</p>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </div>

        <section className="topbar">
          <h1>Welcome, {dashboard?.user?.name}</h1>
          <p>Cyber Awareness & Digital Safety Consulting Platform</p>
        </section>

        {activeSection === "dashboard" && (
          <>
            <section className="stats">
              <div className="stat-card">
                <h3>Latest Quiz Score</h3>
                <p>
                  {dashboard?.latestQuiz
                    ? `${dashboard.latestQuiz.score}/${dashboard.latestQuiz.total}`
                    : "No quiz yet"}
                </p>
              </div>

              <div className="stat-card">
                <h3>Latest Audit Score</h3>
                <p>
                  {dashboard?.latestAudit
                    ? `${dashboard.latestAudit.score}/100`
                    : "No audit yet"}
                </p>
              </div>

              <div className="stat-card">
                <h3>Risk Focus</h3>
                <p>Phishing & Weak Passwords</p>
              </div>
            </section>

            <div className="tool-card">
              <h2>Project Purpose</h2>
              <p>
                This toolkit helps small businesses improve cybersecurity awareness
                through password checking, phishing detection, quizzes, and security audits.
              </p>
            </div>
          </>
        )}

        {activeSection === "password" && (
          <div className="tool-card">
            <h2>Password Strength Checker</h2>

            <input
              type="password"
              placeholder="Enter password to test"
              value={passwordCheck}
              onChange={(e) => setPasswordCheck(e.target.value)}
            />

            <button onClick={checkPasswordStrength}>Check Password</button>

            {passwordResult && <p className="result">{passwordResult}</p>}
          </div>
        )}

        {activeSection === "phishing" && (
          <div className="tool-card">
            <h2>Phishing Message Detector</h2>

            <textarea
              placeholder="Paste suspicious message here..."
              value={phishingText}
              onChange={(e) => setPhishingText(e.target.value)}
            />

            <button onClick={detectPhishing}>Analyze Message</button>

            {phishingResult && <p className="result">{phishingResult}</p>}
          </div>
        )}

        {activeSection === "quiz" && (
          <div className="tool-card">
            <h2>Cyber Awareness Quiz</h2>

            {quizQuestions.map((q, index) => (
              <div className="quiz-question" key={index}>
                <h3>
                  {index + 1}. {q.question}
                </h3>

                {q.options.map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      onChange={() =>
                        setSelectedAnswers({
                          ...selectedAnswers,
                          [index]: option,
                        })
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            ))}

            <button onClick={submitQuiz}>Submit Quiz</button>

            {quizScore !== null && (
              <p className="result">
                Your score: {quizScore}/{quizQuestions.length}
              </p>
            )}
          </div>
        )}

        {activeSection === "audit" && (
          <div className="tool-card">
            <h2>Business Security Audit</h2>

            <label>
              <input className="audit-check" type="checkbox" />
              Strong passwords used
            </label>

            <label>
              <input className="audit-check" type="checkbox" />
              2FA enabled on important accounts
            </label>

            <label>
              <input className="audit-check" type="checkbox" />
              Weekly backups are done
            </label>

            <label>
              <input className="audit-check" type="checkbox" />
              Public Wi-Fi is avoided for banking
            </label>

            <label>
              <input className="audit-check" type="checkbox" />
              Staff can identify phishing signs
            </label>

            <label>
              <input className="audit-check" type="checkbox" />
              Software and apps are updated regularly
            </label>

            <label>
              <input className="audit-check" type="checkbox" />
              Business accounts are not shared carelessly
            </label>

            <button onClick={submitAudit}>Calculate Audit Score</button>

            {auditScore !== null && (
              <p className="result">Audit Score: {auditScore}/100</p>
            )}
          </div>
        )}
        {activeSection === "profile" && (
  <div className="tool-card">
    <h2>User Profile</h2>

    <div className="profile-preview">
      <div className="large-avatar">
        {profileForm.profile_photo ? (
          <img src={profileForm.profile_photo} alt="Profile" />
        ) : (
          profileForm.name?.charAt(0)?.toUpperCase() || "U"
        )}
      </div>

      <div>
        <h3>{profileForm.name || "User Name"}</h3>
        <p>{profileForm.business_name || "Business not added yet"}</p>
      </div>
    </div>

    <form onSubmit={updateProfile}>
      <input
        type="text"
        placeholder="Full name"
        value={profileForm.name}
        onChange={(e) =>
          setProfileForm({ ...profileForm, name: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Profile photo URL"
        value={profileForm.profile_photo}
        onChange={(e) =>
          setProfileForm({ ...profileForm, profile_photo: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Contact number"
        value={profileForm.phone}
        onChange={(e) =>
          setProfileForm({ ...profileForm, phone: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Business name"
        value={profileForm.business_name}
        onChange={(e) =>
          setProfileForm({ ...profileForm, business_name: e.target.value })
        }
      />

      <textarea
        placeholder="Business description"
        value={profileForm.business_description}
        onChange={(e) =>
          setProfileForm({
            ...profileForm,
            business_description: e.target.value
          })
        }
      />

      <input
        type="text"
        placeholder="Residency / Location"
        value={profileForm.residency}
        onChange={(e) =>
          setProfileForm({ ...profileForm, residency: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Emergency contact"
        value={profileForm.emergency_contact}
        onChange={(e) =>
          setProfileForm({
            ...profileForm,
            emergency_contact: e.target.value
          })
        }
      />

      <button type="submit">Save Profile</button>
    </form>

    {message && <p className="result">{message}</p>}
  </div>
)}
{showLogoutModal && (
  <div className="modal-overlay">
    <div className="logout-modal">
      <h2>Confirm Logout</h2>
      <p>Are you sure you want to log out?</p>

      <div className="modal-actions">
        <button className="cancel-btn" onClick={cancelLogout}>
          Cancel
        </button>

        <button className="confirm-logout-btn" onClick={confirmLogout}>
          Yes, Logout
        </button>
      </div>
    </div>
  </div>
)}
      </main>
    </div>
  );
}

export default App;