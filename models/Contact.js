import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [5000, 'Message cannot be more than 5000 characters']
  },
  category: {
    type: String,
    enum: ['general', 'support', 'feedback', 'business', 'technical', 'career', 'other'],
    default: 'general'
  },
  userId: {
    type: String, // Clerk user ID if logged in
    default: null
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: String, // Admin/Support team member ID
    default: null
  },
  response: {
    message: String,
    repliedAt: Date,
    repliedBy: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Index for better query performance
contactSchema.index({ email: 1, status: 1, createdAt: -1 });
contactSchema.index({ category: 1, priority: 1 });

// Virtual for formatted date
contactSchema.virtual('submittedDate').get(function() {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
});

// Method to mark as resolved
contactSchema.methods.markAsResolved = function(responseMessage, repliedBy) {
  this.status = 'resolved';
  this.response = {
    message: responseMessage,
    repliedAt: new Date(),
    repliedBy: repliedBy
  };
  return this.save();
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;