import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: [true, 'Clerk User ID is required'],
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  profileImage: {
    type: String,
    trim: true
  },
  userType: {
    type: String,
    enum: ['job_seeker', 'employer', 'admin'],
    default: 'job_seeker'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    jobAlerts: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    preferredCategories: [{
      type: String
    }],
    preferredLocations: [{
      type: String
    }],
    salaryRange: {
      min: Number,
      max: Number
    }
  },
  profile: {
    headline: {
      type: String,
      maxlength: [100, 'Headline cannot be more than 100 characters']
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    skills: [{
      type: String,
      trim: true
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startYear: Number,
      endYear: Number,
      current: Boolean
    }],
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String
    }],
    resumeUrl: String,
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String
  },
  applications: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'viewed', 'interview', 'rejected', 'accepted'],
      default: 'applied'
    },
    coverLetter: String
  }],
  savedJobs: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better search performance
userSchema.index({ email: 1, userType: 1 });
userSchema.index({ 'preferences.preferredCategories': 1 });
userSchema.index({ 'preferences.preferredLocations': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Method to check if user is employer
userSchema.methods.isEmployer = function() {
  return this.userType === 'employer';
};

// Method to check if user is job seeker
userSchema.methods.isJobSeeker = function() {
  return this.userType === 'job_seeker';
};

// Static method to find or create user from Clerk data
userSchema.statics.findOrCreateFromClerk = async function(clerkUser) {
  let user = await this.findOne({ clerkUserId: clerkUser.id });
  
  if (!user) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const firstName = clerkUser.firstName;
    const lastName = clerkUser.lastName;
    const profileImage = clerkUser.profileImageUrl;

    user = new this({
      clerkUserId: clerkUser.id,
      email: email,
      firstName: firstName,
      lastName: lastName,
      profileImage: profileImage
    });

    await user.save();
    console.log(`✅ Created new user in MongoDB: ${email}`);
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;