import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [50, 'Company name cannot be more than 50 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Volunteer']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Technology', 'Design', 'Marketing', 'Sales', 'Business', 'Customer Service', 'Healthcare', 'Education', 'Engineering', 'Finance', 'Human Resources', 'Operations']
  },
  salary: {
    type: String,
    required: [true, 'Salary information is required']
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  requirements: [{
    type: String,
    required: [true, 'At least one requirement is needed']
  }],
  isRemote: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  employerId: {
    type: String,
    required: [true, 'Employer ID is required']
  },
  applicationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create index for better search performance
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ type: 1, category: 1, isRemote: 1, isFeatured: 1 });

// Virtual for formatted date
jobSchema.virtual('postedDate').get(function() {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
});

// Ensure virtual fields are serialized
jobSchema.set('toJSON', { virtuals: true });

const Job = mongoose.model('Job', jobSchema);

export default Job;