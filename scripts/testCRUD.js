import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testCRUD = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const baseURL = 'http://localhost:5000/api';

    // Test data
    const testJob = {
      title: "Backend Developer",
      company: "TestCorp",
      location: "Remote",
      type: "Full-time",
      category: "Technology",
      salary: "$90,000 - $120,000",
      description: "Test job for backend development",
      requirements: ["Node.js", "MongoDB", "Express", "REST API"],
      isRemote: true,
      isFeatured: false,
      employerId: "test_employer_001"
    };

    const testEmployer = {
      companyName: "TestCorp",
      description: "Test company for CRUD operations",
      website: "https://testcorp.com",
      industry: "Technology",
      size: "11-50",
      location: "San Francisco, CA",
      contactEmail: "test@testcorp.com",
      userId: "test_employer_001"
    };

    console.log('\n🧪 Testing CRUD Operations...\n');

    // Test 1: Create Employer
    console.log('1. Testing CREATE employer...');
    const employerResponse = await fetch(`${baseURL}/employers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmployer)
    });
    const employerData = await employerResponse.json();
    console.log('✅ Create Employer:', employerData.success ? 'SUCCESS' : 'FAILED');

    // Test 2: Create Job
    console.log('2. Testing CREATE job...');
    const jobResponse = await fetch(`${baseURL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testJob)
    });
    const jobData = await jobResponse.json();
    const jobId = jobData.data?._id;
    console.log('✅ Create Job:', jobData.success ? 'SUCCESS' : 'FAILED');

    if (jobId) {
      // Test 3: Read Job
      console.log('3. Testing READ job...');
      const readResponse = await fetch(`${baseURL}/jobs/${jobId}`);
      const readData = await readResponse.json();
      console.log('✅ Read Job:', readData.success ? 'SUCCESS' : 'FAILED');

      // Test 4: Update Job
      console.log('4. Testing UPDATE job...');
      const updateResponse = await fetch(`${baseURL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: true, salary: "$95,000 - $125,000" })
      });
      const updateData = await updateResponse.json();
      console.log('✅ Update Job:', updateData.success ? 'SUCCESS' : 'FAILED');

      // Test 5: Delete Job
      console.log('5. Testing DELETE job...');
      const deleteResponse = await fetch(`${baseURL}/jobs/${jobId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      console.log('✅ Delete Job:', deleteData.success ? 'SUCCESS' : 'FAILED');
    }

    // Clean up test employer
    const employersResponse = await fetch(`${baseURL}/employers`);
    const employersData = await employersResponse.json();
    const testEmployerRecord = employersData.data.find(emp => emp.userId === 'test_employer_001');
    
    if (testEmployerRecord) {
      await fetch(`${baseURL}/employers/${testEmployerRecord._id}`, {
        method: 'DELETE'
      });
      console.log('✅ Cleaned up test employer');
    }

    console.log('\n🎉 CRUD Testing Complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ CRUD Test Error:', error);
    process.exit(1);
  }
};

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCRUD();
}

export default testCRUD;