const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("Ready!"))

// login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Query the database for the user with the provided email
        db.get('SELECT * FROM user WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: "Database error", error: err.message });
            }

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (password == user.password) {
                // User login is successful, now fetch related jobs
                db.all(`
                    SELECT job.id, job.title, job.description
                    FROM job
                    JOIN user_job_relation ON user_job_relation.job_id = job.id
                    WHERE user_job_relation.user_id = ?
                `, [user.id], (err, jobs) => {
                    if (err) {
                        return res.status(500).json({ message: "Error retrieving user jobs", error: err.message });
                    }

                    // Send response with user and job details
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
                // Passwords do not match
                return res.status(401).json({ message: "Invalid email or password" });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
