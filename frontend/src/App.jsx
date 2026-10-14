
import { useEffect, useState } from "react";
import AdminPanel from "./AdminPanel";
import "./index.css";

const API = "http://localhost/skillbridge-ai/backend/api.php";
const AI_API =
  "http://localhost/skillbridge-ai/backend/ai_recommend.php";

async function request(action, data) {
  const response = await fetch(`${API}?action=${action}`, {
    method: data ? "POST" : "GET",
    credentials: "include",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Request failed");
  }

  return result;
}

function App() {
  const [student, setStudent] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [skills, setSkills] = useState("");
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // AI Career Advisor states
  const [interests, setInterests] = useState("");
  const [targetCareer, setTargetCareer] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function loadDashboard() {
    const result = await request("me");

    if (!result.student) {
      setStudent(null);
      return;
    }

    setStudent(result.student);
    setSkills(result.student.skills || "");

    const recommendations = await request("recommend");
    setJobs(recommendations.recommendations || []);
  }

  useEffect(() => {
    loadDashboard().catch(() => {});
  }, []);

  async function handleAuth(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await request(mode, form);
      await loadDashboard();
      setMessage("Welcome to SkillBridge AI!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSkills(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await request("profile", { skills });
      await loadDashboard();
      setMessage("Your skills and recommendations are updated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await request("logout", {});
      setStudent(null);
      setJobs([]);
      setAiResult("");
      setAiError("");
      setForm({ name: "", email: "", password: "" });
      setMessage("You have logged out.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  // Call the PHP backend for real AI recommendations
  async function getAIRecommendations(e) {
    e.preventDefault();

    if (!skills.trim()) {
      setAiError("Please enter and save your skills first.");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiResult("");

    try {
      const response = await fetch(AI_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          skills,
          interests,
          targetCareer
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate recommendations."
        );
      }

      setAiResult(data.recommendation || "No recommendation returned.");
    } catch (error) {
      setAiError(
        error.message ||
          "Unable to connect to the AI service. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  }
if (showAdmin) {
  return (
    <AdminPanel
      onExit={() => setShowAdmin(false)}
    />
  );
}
  if (!student) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-icon">S</div>

          <h1>
            SkillBridge <span>AI</span>
          </h1>

          <p>Discover your skills. Build your career.</p>

          <div className="tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                minLength={8}
                required
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="At least 8 characters"
              />
            </label>

            <button className="primary" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login to Dashboard"
                : "Create Account"}
            </button>
          </form>

          {message && <p className="notice">{message}</p>}
          
          <button
  type="button"
  className="secondary"
  onClick={() => {
    setShowAdmin(true);
    setMessage("");
  }}
>
  Admin Panel
</button>

          <p className="small">Your career journey starts here.</p>
        </section>
      </main>
    );
  }

  const averageMatch = jobs.length
    ? Math.round(
        jobs.reduce(
          (sum, job) => sum + Number(job.match_percentage || 0),
          0
        ) / jobs.length
      )
    : 0;

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="logo" href="#home">
          SkillBridge <span>AI</span>
        </a>

        <div className="user-area">
          <span>{student.name}</span>
          <button className="secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="welcome" id="home">
        <div>
          <p className="eyebrow">STUDENT CAREER DASHBOARD</p>
          <h1>Hello, {student.name}!</h1>
          <p>
            Discover career opportunities that match your skills.
          </p>
        </div>

        <div className="hero-symbol">✦</div>
      </section>

      <section className="stats">
        <article className="stat-card">
          <span>Available job roles</span>
          <strong>{jobs.length}</strong>
          <small>Demo opportunities</small>
        </article>

        <article className="stat-card">
          <span>Average match</span>
          <strong>{averageMatch}%</strong>
          <small>Across listed roles</small>
        </article>

        <article className="stat-card">
          <span>Your skills</span>
          <strong>
            {skills.split(",").filter((s) => s.trim()).length}
          </strong>
          <small>Skills in your profile</small>
        </article>
      </section>

      <section className="panel">
        <h2>My Skills</h2>
        <p>Enter your skills separated by commas.</p>

        <form onSubmit={saveSkills}>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Example: HTML, CSS, JavaScript, React, PHP, MySQL"
            rows={3}
            maxLength={2000}
          />

          <button className="primary" disabled={loading}>
            {loading ? "Saving..." : "Save Skills & Update Matches"}
          </button>
        </form>

        {message && <p className="notice">{message}</p>}
      </section>

      {/* NEW: AI Career Advisor */}
      <section className="panel ai-panel">
        <p className="eyebrow">PERSONALIZED CAREER GUIDANCE</p>
        <h2>AI Career Advisor</h2>

        <p>
          Get career suggestions, identify missing skills, and
          receive a personalized learning roadmap.
        </p>

        <form onSubmit={getAIRecommendations}>
          <label>
            Your interests
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Web development, data analysis..."
              maxLength={500}
            />
          </label>

          <label>
            Target career
            <input
              value={targetCareer}
              onChange={(e) => setTargetCareer(e.target.value)}
              placeholder="Frontend Developer"
              maxLength={200}
            />
          </label>

          <button
            className="primary"
            type="submit"
            disabled={aiLoading || !skills.trim()}
          >
            {aiLoading
              ? "Generating recommendations..."
              : "Get AI Recommendations"}
          </button>
        </form>

        {aiError && (
          <p className="notice" role="alert">
            {aiError}
          </p>
        )}

        {aiResult && (
          <div className="ai-result">
            <h3>Your Personalized Career Roadmap</h3>
            <pre>{aiResult}</pre>
          </div>
        )}
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">PERSONALIZED FOR YOU</p>
          <h2>Career Recommendations</h2>
        </div>
      </section>

      <section className="job-grid">
        {jobs.map((job) => (
          <article className="job-card" key={job.id}>
            <div className="job-top">
              <div className="company-icon">
                {job.company.charAt(0)}
              </div>

              <span className="match">
                {job.match_percentage}% match
              </span>
            </div>

            <h3>{job.title}</h3>
            <p className="company">{job.company}</p>
            <p>{job.description}</p>

            <div className="progress">
              <div
                style={{
                  width: `${job.match_percentage}%`
                }}
              />
            </div>

            <h4>Matched skills</h4>

            <div className="tags">
              {job.matched_skills?.length ? (
                job.matched_skills.map((skill) => (
                  <span className="tag good" key={skill}>
                    {skill}
                  </span>
                ))
              ) : (
                <span className="muted">
                  No matching skills yet
                </span>
              )}
            </div>

            <h4>Skills to develop</h4>

            <div className="tags">
              {job.missing_skills?.length ? (
                job.missing_skills.map((skill) => (
                  <span className="tag" key={skill}>
                    {skill}
                  </span>
                ))
              ) : (
                <span className="muted">
                  All listed skills matched!
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      <footer>
        SkillBridge AI · Student Skill & Placement Recommendation System
      </footer>
    </main>
  );
}

export default App;
