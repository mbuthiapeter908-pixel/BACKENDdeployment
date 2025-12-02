import express from 'express';
import Contact from '../models/Contact.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, category, userId } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Create contact inquiry
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      category: category || 'general',
      userId: userId || null
    });

    await contact.save();

    // Send confirmation email (if email service configured)
    await sendConfirmationEmail(contact);

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We\'ll get back to you soon.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        submittedDate: contact.submittedDate
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting contact form',
      error: error.message
    });
  }
});

// GET /api/contact/stats - Get contact statistics (admin)
router.get('/stats', async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });
    const resolvedContacts = await Contact.countDocuments({ status: 'resolved' });

    // Category statistics
    const categoryStats = await Contact.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Priority statistics
    const priorityStats = await Contact.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalContacts,
        newContacts,
        resolvedContacts,
        categories: categoryStats,
        priorities: priorityStats
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact statistics',
      error: error.message
    });
  }
});

// GET /api/contact/user/:userId - Get user's contact inquiries
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const contacts = await Contact.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments({ userId });

    res.json({
      success: true,
      data: contacts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: contacts.length,
        totalContacts: total
      }
    });

  } catch (error) {
    console.error('Get user contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user contacts',
      error: error.message
    });
  }
});

// POST /api/contact/:id/response - Add response to contact inquiry (admin)
router.post('/:id/response', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, repliedBy } = req.body;

    if (!message || !repliedBy) {
      return res.status(400).json({
        success: false,
        message: 'Response message and replier info are required'
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact inquiry not found'
      });
    }

    await contact.markAsResolved(message, repliedBy);

    // Send response email to user
    await sendResponseEmail(contact, message);

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: contact
    });

  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending response',
      error: error.message
    });
  }
});

// Helper function to send confirmation email
const sendConfirmationEmail = async (contact) => {
  try {
    // Configure nodemailer with your email service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contact.email,
      subject: `JobHub: We've received your message - ${contact.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Thank You for Contacting JobHub!</h2>
          <p>Hello ${contact.name},</p>
          <p>We've received your message and our team will get back to you within 24-48 hours.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569;">Your Message Details:</h3>
            <p><strong>Subject:</strong> ${contact.subject}</p>
            <p><strong>Category:</strong> ${contact.category}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-radius: 5px;">${contact.message}</p>
          </div>
          <p>If you need immediate assistance, please check our <a href="https://jobhub.faq.com">FAQ page</a>.</p>
          <p>Best regards,<br>The JobHub Team</p>
        </div>
      `
    };

    if (process.env.NODE_ENV === 'production') {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Confirmation email sent to: ${contact.email}`);
    }

  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the request if email fails
  }
};

// Helper function to send response email
const sendResponseEmail = async (contact, responseMessage) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contact.email,
      subject: `JobHub: Response to your inquiry - ${contact.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Response from JobHub Support Team</h2>
          <p>Hello ${contact.name},</p>
          <p>Thank you for contacting JobHub. Here's our response to your inquiry:</p>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1;">Our Response:</h3>
            <p style="background-color: white; padding: 15px; border-radius: 5px;">${responseMessage}</p>
          </div>
          <p>If you have any further questions, please don't hesitate to contact us again.</p>
          <p>Best regards,<br>The JobHub Support Team</p>
        </div>
      `
    };

    if (process.env.NODE_ENV === 'production') {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Response email sent to: ${contact.email}`);
    }

  } catch (error) {
    console.error('Response email error:', error);
  }
};

export default router;