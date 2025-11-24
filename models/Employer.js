import mongoose from 'mongoose';

const employerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required']
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    required: [true, 'Company size is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    trim: true,
    lowercase: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  jobCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

employerSchema.index({ companyName: 'text', industry: 1 });

const Employer = mongoose.model('Employer', employerSchema);

export default Employer;