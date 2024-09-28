const express = require('express');
const bodyParser = require('body-parser');
const serverless = require('serverless-http');
const db = require('../database/database');

const app = express();

// Middleware
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("Ready!"));

// login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    db.get('SELECT * FROM user WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (password == user.password) {
        db.all(`
          SELECT job.id, job.title, job.description
          FROM job
          JOIN user_job_relation ON user_job_relation.job_id = job.id
          WHERE user_job_relation.user_id = ?
        `, [user.id], (err, jobs) => {
          if (err) {
            return res.status(500).json({ message: "Error retrieving user jobs", error: err.message });
          }

          return res.status(200).json({
            message: "Login successful",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              jobs: jobs
            },
          });
        });
      } else {
        return res.status(401).json({ message: "Invalid email or password" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports.handler = serverless(app);
