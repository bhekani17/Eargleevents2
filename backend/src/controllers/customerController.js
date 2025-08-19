import mongoose from 'mongoose';
import Customer from '../models/customer.js';
import Quote from '../models/quote.js';
import asyncHandler from 'express-async-handler';

// @desc    Create customer
// @route   POST /api/admin/customers
// @access  Private/Admin
export const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, notes, address, company, status, bookingDate } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }
  const existing = await Customer.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Customer with this email already exists' });
  }
  const customer = await Customer.create({ 
    name, 
    email, 
    phone, 
    notes,
    address,
    company,
    status: status || 'active',
    bookingDate: bookingDate || null
  });
  res.status(201).json({ success: true, data: customer });
});

// @desc    Get customers with approved quotes
// @route   GET /api/admin/customers/approved-quotes
// @access  Private/Admin
export const getCustomersWithApprovedQuotes = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;
    
    // Build match stage for approved/confirmed quotes
    const matchStage = {
      $or: [
        { status: 'approved' },
        { status: 'confirmed' }
      ]
    };
    
    // Add search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStage.$and = [{
        $or: [
          { customerName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { phone: { $regex: searchRegex } }
        ]
      }];
    }

    // Aggregate customers from approved quotes with pagination
    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          lowerEmail: { $toLower: { $ifNull: ['$email', ''] } }
        }
      },
      {
        $group: {
          _id: '$lowerEmail',
          id: { $first: '$_id' },
          name: { $first: '$customerName' },
          email: { $first: '$email' },
          phone: { $first: '$phone' },
          lastEventDate: { $max: '$eventDate' },
          lastQuoteId: { $last: '$_id' },
          quotesCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalAmount', 0] } },
          status: { $literal: 'booked' },
          source: { $literal: 'quote' }
        }
      },
      {
        $project: {
          _id: 0,
          id: '$id',
          name: 1,
          email: 1,
          phone: 1,
          lastEventDate: 1,
          lastQuoteId: 1,
          quotesCount: 1,
          totalSpent: 1,
          status: 1,
          source: 1
        }
      },
      { $sort: { lastEventDate: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ];

    // Get total count for pagination
    const countPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { $toLower: { $ifNull: ['$email', ''] } }
        }
      },
      { $count: 'total' }
    ];

    const [customers, countResult] = await Promise.all([
      Quote.aggregate(pipeline),
      Quote.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: customers,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching customers with approved quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customers with approved quotes'
    });
  }
});

// @desc    Get customers (Customer collection as source of truth)
// @route   GET /api/admin/customers
// @access  Private/Admin
export const getCustomers = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      const rx = new RegExp(String(search), 'i');
      filter.$or = [
        { name: { $regex: rx } },
        { email: { $regex: rx } },
        { phone: { $regex: rx } },
        { company: { $regex: rx } }
      ];
    }

    const [items, total] = await Promise.all([
      Customer.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Customer.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching customers' });
  }
});

// @desc    Get single customer
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
export const getCustomerById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching customer' });
  }
});

// @desc    Update customer
// @route   PUT /api/admin/customers/:id
// @access  Private/Admin
export const updateCustomer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['name', 'email', 'phone', 'address', 'company', 'notes', 'status', 'bookingDate'];
    const update = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    // If email is changing, ensure uniqueness
    if (update.email) {
      const existing = await Customer.findOne({ email: update.email, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use by another customer' });
      }
    }

    const customer = await Customer.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, message: 'Server error while updating customer' });
  }
});

// @desc    Delete customer
// @route   DELETE /api/admin/customers/:id
// @access  Private/Admin
export const deleteCustomer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Customer.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: { message: 'Customer deleted' } });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting customer' });
  }
});
