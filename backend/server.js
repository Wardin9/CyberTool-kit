const express = require("express");
const cors = require("cors");
const db = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = "cyber_safety_secret_key";

app.get("/", (req, res) => {
  res.send("Cyber Safety Backend Running");
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name, email, passwordHash],
      function (err) {
        if (err) {
          return res.status(500).json({
            message: "Email may already exist",
            error: err.message
          });
        }

        res.status(201).json({
          message: "User registered successfully",
          userId: this.lastID
        });
      }
    );

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  // Find user by email
  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message
        });
      }

      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      // Compare typed password with hashed password
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email
        },
        JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.json({
        message: "Login successful",
        token: token,
        user: {
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  business_name: user.business_name,
  business_description: user.business_description,
  residency: user.residency,
  emergency_contact: user.emergency_contact,
  profile_photo: user.profile_photo
}
      });
    }
  );
});

app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected profile loaded successfully",
    user: req.user
  });
});

app.post("/api/quiz-results", authMiddleware, (req, res) => {
  const { score, total } = req.body;

  if (score === undefined || total === undefined) {
    return res.status(400).json({
      message: "Score and total are required"
    });
  }

  db.run(
    `INSERT INTO quiz_results (user_id, score, total)
     VALUES (?, ?, ?)`,
    [req.user.id, score, total],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message
        });
      }

      res.status(201).json({
        message: "Quiz result saved successfully",
        resultId: this.lastID
      });
    }
  );
});

app.post("/api/audit-results", authMiddleware, (req, res) => {
  const { score } = req.body;

  if (score === undefined) {
    return res.status(400).json({
      message: "Audit score is required"
    });
  }

  db.run(
    `INSERT INTO audit_results (user_id, score)
     VALUES (?, ?)`,
    [req.user.id, score],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message
        });
      }

      res.status(201).json({
        message: "Audit result saved successfully",
        resultId: this.lastID
      });
    }
  );
});

app.get("/api/dashboard", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT 
      id,
      name,
      email,
      phone,
      business_name,
      business_description,
      residency,
      emergency_contact,
      profile_photo
     FROM users
     WHERE id = ?`,
    [userId],
    (err, userProfile) => {
      if (err) {
        return res.status(500).json({
          message: "User fetch error"
        });
      }

      db.get(
        `SELECT score, total, created_at
         FROM quiz_results
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId],
        (err, latestQuiz) => {
          if (err) {
            return res.status(500).json({
              message: "Quiz fetch error"
            });
          }

          db.get(
            `SELECT score, created_at
             FROM audit_results
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId],
            (err, latestAudit) => {
              if (err) {
                return res.status(500).json({
                  message: "Audit fetch error"
                });
              }

              db.all(
                `SELECT score, total, created_at
                 FROM quiz_results
                 WHERE user_id = ?
                 ORDER BY created_at ASC
                 LIMIT 5`,
                [userId],
                (err, quizHistory) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Quiz history error"
                    });
                  }

                  db.all(
                    `SELECT score, created_at
                     FROM audit_results
                     WHERE user_id = ?
                     ORDER BY created_at ASC
                     LIMIT 5`,
                    [userId],
                    (err, auditHistory) => {
                      if (err) {
                        return res.status(500).json({
                          message: "Audit history error"
                        });
                      }

                      res.json({
                        message: "Dashboard loaded",
                        user: userProfile,
                        latestQuiz: latestQuiz || null,
                        latestAudit: latestAudit || null,
                        quizHistory: quizHistory || [],
                        auditHistory: auditHistory || []
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

app.put("/api/profile", authMiddleware, (req, res) => {
  const {
    name,
    phone,
    business_name,
    business_description,
    residency,
    emergency_contact,
    profile_photo
  } = req.body;

  db.run(
    `UPDATE users
     SET name = ?,
         phone = ?,
         business_name = ?,
         business_description = ?,
         residency = ?,
         emergency_contact = ?,
         profile_photo = ?
     WHERE id = ?`,
    [
      name,
      phone,
      business_name,
      business_description,
      residency,
      emergency_contact,
      profile_photo,
      req.user.id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: "Profile update failed",
          error: err.message
        });
      }

      res.json({
        message: "Profile updated successfully"
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});