import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';
import Employer from '../models/Employer.js';

dotenv.config();

const sampleJobs = [
  {
    title: "Frontend Developer",
    company: "TechCorp",
    location: "San Francisco, CA",
    type: "Full-time",
    category: "Technology",
    salary: "$80,000 - $100,000",
    description: "We are looking for a skilled Frontend Developer to join our dynamic team. You'll be working with modern technologies like React, TypeScript, and Next.js to build amazing user experiences.",
    requirements: ["React", "JavaScript", "TypeScript", "CSS", "HTML5", "Next.js"],
    isRemote: true,
    isFeatured: true,
    isUrgent: false,
    employerId: "employer_001"
  },
  {
    title: "Marketing Intern",
    company: "GrowthLabs",
    location: "New York, NY",
    type: "Internship",
    category: "Marketing",
    salary: "$25 - $30/hour",
    description: "Exciting internship opportunity for marketing students. You'll work on real campaigns, social media strategy, and analytics for top brands.",
    requirements: ["Social Media", "Content Creation", "Analytics", "Marketing"],
    isRemote: false,
    isFeatured: false,
    isUrgent: true,
    employerId: "employer_002"
  },
  {
    title: "UX Designer",
    company: "DesignStudio",
    location: "Remote",
    type: "Full-time",
    category: "Design",
    salary: "$70,000 - $90,000",
    description: "Join our design team to create amazing user experiences. We're looking for someone passionate about user-centered design and modern design tools.",
    requirements: ["Figma", "User Research", "Prototyping", "UI/UX Design"],
    isRemote: true,
    isFeatured: true,
    isUrgent: false,
    employerId: "employer_003"
  },
  {
    title: "Backend Developer",
    company: "CodeCraft",
    location: "Austin, TX",
    type: "Full-time",
    category: "Technology",
    salary: "$85,000 - $110,000",
    description: "Looking for a Backend Developer to build scalable APIs and services. Experience with Node.js, MongoDB, and cloud platforms required.",
    requirements: ["Node.js", "MongoDB", "Express", "REST API", "AWS"],
    isRemote: true,
    isFeatured: false,
    isUrgent: true,
    employerId: "employer_004"
  },
  {
    title: "Data Analyst",
    company: "DataInsights",
    location: "Chicago, IL",
    type: "Full-time",
    category: "Business",
    salary: "$65,000 - $85,000",
    description: "Join our data team to analyze business metrics and provide insights. Perfect for recent graduates with strong analytical skills.",
    requirements: ["SQL", "Excel", "Data Visualization", "Statistics"],
    isRemote: false,
    isFeatured: true,
    isUrgent: false,
    employerId: "employer_005"
  },
  {
    title: "Product Manager",
    company: "InnovateTech",
    location: "Seattle, WA",
    type: "Full-time",
    category: "Business",
    salary: "$95,000 - $120,000",
    description: "Lead product development from conception to launch. Work with engineering, design, and marketing teams to build products users love.",
    requirements: ["Product Management", "Agile", "User Stories", "Roadmapping"],
    isRemote: true,
    isFeatured: true,
    isUrgent: false,
    employerId: "employer_006"
  },
  {
    title: "Customer Success Manager",
    company: "SaaS Solutions",
    location: "Remote",
    type: "Full-time",
    category: "Customer Service",
    salary: "$60,000 - $75,000",
    description: "Help our customers achieve their goals using our platform. Build strong relationships and ensure customer satisfaction and retention.",
    requirements: ["Customer Service", "CRM", "Communication", "Problem Solving"],
    isRemote: true,
    isFeatured: false,
    isUrgent: false,
    employerId: "employer_007"
  },
  {
    title: "DevOps Engineer",
    company: "CloudSystems",
    location: "Boston, MA",
    type: "Full-time",
    category: "Technology",
    salary: "$90,000 - $115,000",
    description: "Manage our cloud infrastructure and deployment pipelines. Experience with Docker, Kubernetes, and CI/CD required.",
    requirements: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
    isRemote: true,
    isFeatured: true,
    isUrgent: true,
    employerId: "employer_008"
  }
];

const sampleEmployers = [
  {
    companyName: "TechCorp",
    description: "Leading technology company focused on innovative solutions",
    website: "https://techcorp.com",
    industry: "Technology",
    size: "201-500",
    location: "San Francisco, CA",
    contactEmail: "careers@techcorp.com",
    userId: "employer_001",
    isVerified: true,
    jobCount: 1
  },
  {
    companyName: "GrowthLabs",
    description: "Digital marketing agency helping brands grow",
    website: "https://growthlabs.com",
    industry: "Marketing",
    size: "11-50",
    location: "New York, NY",
    contactEmail: "hello@growthlabs.com",
    userId: "employer_002",
    isVerified: true,
    jobCount: 1
  },
  {
    companyName: "DesignStudio",
    description: "Creative design agency specializing in user experience",
    website: "https://designstudio.com",
    industry: "Design",
    size: "51-200",
    location: "Austin, TX",
    contactEmail: "jobs@designstudio.com",
    userId: "employer_003",
    isVerified: true,
    jobCount: 1
  },
  {
    companyName: "CodeCraft",
    description: "Software development company building modern applications",
    website: "https://codecraft.com",
    industry: "Technology",
    size: "11-50",
    location: "Austin, TX",
    contactEmail: "jobs@codecraft.com",
    userId: "employer_004",
    isVerified: true,
    jobCount: 1
  },
  {
    companyName: "DataInsights",
    description: "Data analytics consulting firm",
    website: "https://datainsights.com",
    industry: "Business",
    size: "51-200",
    location: "Chicago, IL",
    contactEmail: "careers@datainsights.com",
    userId: "employer_005",
    isVerified: true,
    jobCount: 1
  },
  {
    companyName: "InnovateTech",
    description: "Product development studio for startups",
    website: "https://innovatetech.com",
    industry: "Technology",
    size: "11-50",
    location: "Seattle, WA",
    contactEmail: "hello@innovatetech.com",
    userId: "employer_006",
    isVerified: true,
    jobCount: 1
  },
  {
    companyName: "SaaS Solutions",
    description: "Software as a Service company for small businesses",
    website: "https://saassolutions.com",
    industry: "Technology",
    size: "51-200",
    location: "Remote",
    contactEmail: "info@saassolutions.com",
    userId: "employer_007",
    isVerified: true,
    jobCount: 1
  },
  {
    companyName: "CloudSystems",
    description: "Cloud infrastructure and DevOps consulting",
    website: "https://cloudsystems.com",
    industry: "Technology",
    size: "11-50",
    location: "Boston, MA",
    contactEmail: "jobs@cloudsystems.com",
    userId: "employer_008",
    isVerified: true,
    jobCount: 1
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Job.deleteMany({});
    await Employer.deleteMany({});
    console.log('✅ Cleared existing data');

    // Insert sample data
    const jobs = await Job.insertMany(sampleJobs);
    const employers = await Employer.insertMany(sampleEmployers);
    
    console.log(`✅ Seeded ${jobs.length} jobs`);
    console.log(`✅ Seeded ${employers.length} employers`);
    
    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();