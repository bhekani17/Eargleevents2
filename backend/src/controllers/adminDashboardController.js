 import asyncHandler from 'express-async-handler';
 import Quote from '../models/quote.js';
 import Customer from '../models/customer.js';
 import ContactMessage from '../models/contactMessage.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
 export const getDashboardStats = asyncHandler(async (req, res) => {
   try {
     const [
       totalQuotes,
       totalCustomers,
       unreadMessages,
       recentQuotes,
       recentCustomers,
       recentMessages
     ] = await Promise.all([
       Quote.countDocuments(),
       Customer.countDocuments(),
       // Treat 'new' contact messages as unread
       ContactMessage.countDocuments({ status: 'new' }),
       Quote.find().sort({ createdAt: -1 }).limit(5),
       Customer.find().sort({ createdAt: -1 }).limit(5),
       ContactMessage.find().sort({ createdAt: -1 }).limit(5)
     ]);

     const [pendingQuotes, completedQuotes] = await Promise.all([
       Quote.countDocuments({ status: 'pending' }),
       Quote.countDocuments({ status: 'completed' })
     ]);

     res.json({
       stats: {
         totalQuotes,
         totalCustomers,
         unreadMessages,
         pendingQuotes,
         completedQuotes
       },
       recent: {
         quotes: recentQuotes,
         customers: recentCustomers,
         messages: recentMessages
       }
     });
   } catch (error) {
     console.error('Error fetching dashboard stats:', error);
     res.status(500).json({ message: 'Server error while fetching dashboard stats' });
   }
 });
