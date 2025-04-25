const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const multer = require('multer');  // Import multer for handling file uploads
const path = require('path');
const { protect, authorize } = require('../middleware/authmiddleware'); // ✅ import your middleware

// Set up multer for file storage (PDF resume upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/resumes');  // Folder to store uploaded resumes
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));  // Save file with a unique name
  },
});

// Filter for PDF files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);  // Accept PDF files
  } else {
    cb(new Error('Only PDF files are allowed!'), false);  // Reject non-PDF files
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
});

// CREATE a new job (protected, any authenticated user)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, company, location } = req.body;
    const newJob = new Job({ title, description, company, location });
    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all jobs (protected)
router.get('/', protect, async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE a job (protected)
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, company, location } = req.body;
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { title, description, company, location },
      { new: true }
    );
    res.status(200).json(updatedJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a job (protected and only for 'admin' role)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// APPLY for a job (protected, allows users to upload a resume)
router.post('/apply/:jobId', protect, upload.single('resume'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Here you can store the resume file information in a separate "applications" collection or attach it to the job.
    // For simplicity, we just send the file path and job details.
    res.status(200).json({
      message: 'Congrats, you are selected!',
      resumeUrl: req.file.path,  // Return the file path of the uploaded resume
      jobTitle: job.title,
      company: job.company,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error submitting resume' });
  }
});

module.exports = router;
