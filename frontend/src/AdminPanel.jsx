
import "./AdminPanel.css";
import { useEffect, useState } from "react";

const API = "http://localhost/skillbridge-ai/backend/api.php";

async function apiRequest(action, data = null) {
  const options = {
    method: data === null ? "GET" : "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API}?action=${action}`, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Request failed");
  }

  return result;
}

export default function AdminPanel({ onExit }) {
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("admin@skillbridge.local");
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState({
    total_students: 0,
    total_jobs: 0,
  });
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    required_skills: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    const [dashboard, studentData, jobData] = await Promise.all([
      apiRequest("admin_dashboard"),
      apiRequest("admin_students"),
      apiRequest("jobs"),
    ]);

    setStats(dashboard);
    setStudents(studentData.students || []);
    setJobs(jobData.jobs || []);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await apiRequest("admin_login", {
        email,
        password,
      });

      setAdmin(result.admin);
      setPassword("");
      setMessage("Admin login successful.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!admin) return;

    loadDashboard().catch((error) => setMessage(error.message));
  }, [admin]);

  async function handleAddJob(event) {
    event.preventDefault();
    setMessage("");

    try {
      const result = await apiRequest("admin_add_job", form);
      setMessage(result.message);

      setForm({
        title: "",
        company: "",
        description: "",
        required_skills: "",
      });

      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteJob(id) {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    setMessage("");

    try {
      const result = await apiRequest("admin_delete_job", { id });
      setMessage(result.message);
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("logout", {});
    } catch {
      // Clear this panel even if the request fails.
    }

    setAdmin(null);
    setPassword("");
    setMessage("");
    onExit?.();
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f4f7fb",
      padding: "28px",
      fontFamily: "Arial, sans-serif",
      color: "#172033",
    },
    card: {
      background: "#fff",
      padding: "22px",
      borderRadius: "14px",
      boxShadow: "0 4px 18px #15223812",
      marginBottom: "22px",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px",
      margin: "8px 0 14px",
      border: "1px solid #d5dbe5",
      borderRadius: "8px",
    },
    button: {
      background: "#ff6b00",
      color: "#fff",
      border: "none",
      padding: "11px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "#fff",
    },
    cell: {
      textAlign: "left",
      padding: "12px",
      borderBottom: "1px solid #e7eaf0",
    },
  };

  if (!admin) {
    return (
      <main className="admin-page" style={styles.page}>
        <section
          className="admin-card admin-login-card"
          style={{
            ...styles.card,
            maxWidth: "420px",
            margin: "60px auto",
          }}
        >
          <div className="admin-brand-icon">S</div>

          <h1 className="admin-login-title">SkillBridge <span>AI</span></h1>
          <h2>Admin Login</h2>
          <p className="admin-subtitle">
            Sign in to manage students and job listings.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              className="admin-input"
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="admin-input"
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="admin-button admin-primary-button"
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login as Admin"}
            </button>
          </form>

          {message && (
            <p className="admin-notice" role="status">{message}</p>
          )}

          <button
            type="button"
            className="admin-button admin-back-button"
            style={{
              ...styles.button,
              background: "#475569",
              marginTop: "12px",
            }}
            onClick={onExit}
          >
            Back to Student Panel
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page" style={styles.page}>
      <header className="admin-topbar">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION</p>
          <h1>SkillBridge <span>AI</span></h1>
          <p className="admin-welcome">Welcome, {admin.name}</p>
        </div>

        <button
          className="admin-button admin-logout-button"
          style={styles.button}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      {message && (
        <p className="admin-notice admin-card" role="status" style={styles.card}>
          {message}
        </p>
      )}

      <section className="admin-stats-grid">
        <div className="admin-card admin-stat-card" style={styles.card}>
          <div className="admin-stat-icon">👨‍🎓</div>
          <p>Total Students</p>
          <h2>{stats.total_students}</h2>
          <span>Registered student accounts</span>
        </div>

        <div className="admin-card admin-stat-card" style={styles.card}>
          <div className="admin-stat-icon">💼</div>
          <p>Total Jobs</p>
          <h2>{stats.total_jobs}</h2>
          <span>Available sample job listings</span>
        </div>
      </section>

      <section className="admin-card" style={styles.card}>
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">JOB MANAGEMENT</p>
            <h2>Add Job Listing</h2>
          </div>
          <span className="admin-section-icon">＋</span>
        </div>

        <form className="admin-job-form" onSubmit={handleAddJob}>
          <div className="admin-form-grid">
            <label>
              Job Title *
              <input
                className="admin-input"
                style={styles.input}
                placeholder="e.g. Junior Web Developer"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                required
              />
            </label>

            <label>
              Company *
              <input
                className="admin-input"
                style={styles.input}
                placeholder="e.g. ABC Technologies"
                value={form.company}
                onChange={(e) =>
                  setForm({ ...form, company: e.target.value })
                }
                required
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              className="admin-input"
              style={styles.input}
              rows="3"
              placeholder="Describe the role and responsibilities..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>

          <label>
            Required Skills *
            <input
              className="admin-input"
              style={styles.input}
              placeholder="React, JavaScript, HTML, CSS"
              value={form.required_skills}
              onChange={(e) =>
                setForm({ ...form, required_skills: e.target.value })
              }
              required
            />
          </label>

          <button
            className="admin-button admin-primary-button"
            style={styles.button}
            type="submit"
          >
            + Add Job
          </button>
        </form>
      </section>

      <section className="admin-card" style={styles.card}>
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">LISTINGS</p>
            <h2>Manage Jobs</h2>
          </div>
          <span className="admin-count">{jobs.length} jobs</span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Title</th>
                <th style={styles.cell}>Company</th>
                <th style={styles.cell}>Required Skills</th>
                <th style={styles.cell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={styles.cell}>
                    <strong>{job.title}</strong>
                    <p className="admin-job-description">{job.description}</p>
                  </td>
                  <td style={styles.cell}>{job.company}</td>
                  <td style={styles.cell}>
                    <div className="admin-skill-tags">
                      {(job.required_skills || "")
                        .split(",")
                        .filter((skill) => skill.trim())
                        .map((skill) => (
                          <span className="admin-skill-tag" key={skill}>
                            {skill.trim()}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td style={styles.cell}>
                    <button
                      className="admin-button admin-delete-button"
                      style={{ ...styles.button, background: "#dc2626" }}
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {jobs.length === 0 && (
                <tr>
                  <td style={styles.cell} colSpan="4">
                    No jobs found. Add your first job above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card" style={styles.card}>
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">STUDENT RECORDS</p>
            <h2>Registered Students</h2>
          </div>
          <span className="admin-count">{students.length} students</span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>ID</th>
                <th style={styles.cell}>Name</th>
                <th style={styles.cell}>Email</th>
                <th style={styles.cell}>Skills</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={styles.cell}>{student.id}</td>
                  <td style={styles.cell}>
                    <strong>{student.name}</strong>
                  </td>
                  <td style={styles.cell}>{student.email}</td>
                  <td style={styles.cell}>
                    {student.skills || "Not added"}
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td style={styles.cell} colSpan="4">
                    No students registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="admin-footer">
        SkillBridge AI · Admin Dashboard
      </footer>
    </main>
  );
}
