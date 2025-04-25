const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  company: {
    type: String,
    required: [true, 'Company is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  }
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
