const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const connectDB = require("./config/datbase"); // optional if you use mongoose.connect directly
const authRoutes = require("./routes/UserRoutes");
const jobRoutes = require("./routes/jobs");
const Feedback = require("./models/Feedback"); // Make sure this file exists

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json()); // needed for nodemailer feedback

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// Feedback submission route
app.post('/submit-feedback', async (req, res) => {
  const { name, email, feedback } = req.body;

  try {
    const feedbackEntry = new Feedback({ name, email, feedback });
    await feedbackEntry.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Thank you for your feedback, ${name}!`,
      text: `Hi ${name},\n\nWe have received your feedback: "${feedback}".\nWe will get back to you soon!\n\nBest Regards,\nYour Team`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Feedback submitted successfully and email sent!' });

  } catch (error) {
    console.error('❌ Error submitting feedback: ', error);
    res.status(500).send({ message: 'Something went wrong.' });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("🌐 Backend is running...");
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
