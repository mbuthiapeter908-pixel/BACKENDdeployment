import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Clerk webhook secret - set this in your environment variables
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Webhook endpoint for Clerk
router.post('/clerk', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log(`📨 Received Clerk webhook: ${type}`);

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle new user creation from Clerk
const handleUserCreated = async (data) => {
  try {
    const clerkUser = data;
    
    // Create user in MongoDB
    const user = await User.findOrCreateFromClerk(clerkUser);
    
    console.log(`✅ User synchronized to MongoDB: ${user.email}`);
    return user;
  } catch (error) {
    console.error('❌ Error creating user from webhook:', error);
    throw error;
  }
};

// Handle user updates from Clerk
const handleUserUpdated = async (data) => {
  try {
    const clerkUser = data;
    const user = await User.findOne({ clerkUserId: clerkUser.id });

    if (user) {
      user.firstName = clerkUser.firstName || user.firstName;
      user.lastName = clerkUser.lastName || user.lastName;
      user.profileImage = clerkUser.profileImageUrl || user.profileImage;
      user.email = clerkUser.emailAddresses[0]?.emailAddress || user.email;

      await user.save();
      console.log(`✅ Updated user in MongoDB: ${user.email}`);
    }
  } catch (error) {
    console.error('❌ Error updating user from webhook:', error);
    throw error;
  }
};

// Handle user deletion from Clerk
const handleUserDeleted = async (data) => {
  try {
    const clerkUser = data;
    const user = await User.findOne({ clerkUserId: clerkUser.id });

    if (user) {
      // Soft delete - mark as inactive instead of actually deleting
      user.isActive = false;
      await user.save();
      
      console.log(`✅ Soft-deleted user in MongoDB: ${user.email}`);
    }
  } catch (error) {
    console.error('❌ Error deleting user from webhook:', error);
    throw error;
  }
};

export default router;