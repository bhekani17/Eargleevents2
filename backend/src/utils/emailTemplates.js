/**
 * Email templates for Eagle Events
 * Contains HTML templates for various email notifications
 */

/**
 * Generate HTML template for customer quote confirmation email
 * @param {Object} quote - The quote object
 * @param {String} eventDate - Formatted event date
 * @returns {String} HTML email template
 */
export const customerQuoteTemplate = (quote, eventDate) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Confirmation | Eagle Events</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Poppins', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f7fa;
    }
    
    .container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    
    .header {
      background: #000000;
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #D4AF37;
    }
    
    .header h1 {
      margin: 0;
      font-weight: 600;
      font-size: 28px;
      letter-spacing: 0.5px;
    }
    
    .header p {
      margin-top: 10px;
      font-size: 16px;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    
    .highlight {
      background-color: #f8f8f8;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #D4AF37;
      margin: 25px 0;
    }
    
    .highlight p {
      margin: 8px 0;
      font-size: 15px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #000000;
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #D4AF37;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0 25px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #eaeaea;
    }
    
    th {
      background-color: #000000;
      font-weight: 600;
      color: #ffffff;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #D4AF37;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr:nth-child(even) {
      background-color: #fafbfd;
    }
    
    .total-row {
      background-color: #f8f8f8 !important;
      font-weight: 600;
      border-top: 1px solid #D4AF37;
    }
    
    .total-row td {
      color: #000000;
    }
    
    .service-list {
      list-style: none;
      padding: 0;
      margin: 15px 0 25px;
    }
    
    .service-list li {
      padding: 10px 15px;
      background-color: #f8f8f8;
      margin-bottom: 8px;
      border-radius: 6px;
      font-size: 15px;
      border-left: 3px solid #D4AF37;
    }
    
    .payment-method {
      background-color: #f8f8f8;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 15px;
      border-left: 3px solid #D4AF37;
    }
    
    .notes-section {
      background-color: #f8f8f8;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 3px solid #D4AF37;
    }
    
    .contact-section {
      margin-top: 35px;
      padding: 20px;
      background-color: #f8f8f8;
      border-radius: 8px;
      border-top: 2px solid #D4AF37;
    }
    
    .contact-section h3 {
      font-size: 18px;
      color: #000000;
      margin-bottom: 15px;
    }
    
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .contact-item {
      flex: 1;
      min-width: 200px;
      padding: 12px;
      background-color: white;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    
    .contact-item strong {
      display: block;
      margin-bottom: 5px;
      color: #D4AF37;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #D4AF37;
      color: black;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 20px;
      text-align: center;
      transition: transform 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
    }
    
    .footer {
      background-color: #000000;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #ffffff;
      border-top: 2px solid #D4AF37;
    }
    
    .social-links {
      margin: 15px 0;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #D4AF37;
      text-decoration: none;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      
      .content {
        padding: 20px 15px;
      }
      
      .header {
        padding: 20px 15px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      table {
        font-size: 14px;
      }
      
      th, td {
        padding: 8px 10px;
      }
      
      .contact-item {
        min-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Eagle Events</h1>
      <p>Your Quote Request Has Been Received</p>
    </div>
    
    <div class="content">
      <p class="greeting">Dear ${quote.customerName},</p>
      
      <p>Thank you for choosing Eagle Events for your upcoming event. We have received your quote request and our team is reviewing the details.</p>
      
      <div class="highlight">
        <p><strong>Quote Reference:</strong> ${quote._id}</p>
        <p><strong>Event Date:</strong> ${eventDate}</p>
        <p><strong>Status:</strong> ${quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}</p>
      </div>
      
      <h3 class="section-title">Event Details</h3>
      <table>
        <tr>
          <th>Event Type</th>
          <td>${quote.eventType}${quote.eventType === 'other' && quote.eventTypeOther ? ` (${quote.eventTypeOther})` : ''}</td>
        </tr>
        ${quote.company ? `<tr><th>Company</th><td>${quote.company}</td></tr>` : ''}
        <tr>
          <th>Guest Count</th>
          <td>${quote.guestCount}</td>
        </tr>
        <tr>
          <th>Location</th>
          <td>${quote.location}</td>
        </tr>
      </table>
      
      <h3 class="section-title">Services Requested</h3>
      <ul class="service-list">
        ${quote.services.map(service => `<li>${service}</li>`).join('')}
      </ul>
      
      <h3 class="section-title">Selected Items</h3>
      <table>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
        ${quote.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>R${item.price.toFixed(2)}</td>
            <td>R${(item.quantity * item.price).toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <th colspan="3">Total Amount</th>
          <td><strong>R${quote.totalAmount.toFixed(2)}</strong></td>
        </tr>
      </table>
      
      <div class="payment-method">
        <strong>Payment Method:</strong> ${formatPaymentMethod(quote.paymentMethod)}
      </div>
      
      ${quote.notes ? `
        <div class="notes-section">
          <h3 class="section-title">Your Notes</h3>
          <p>${quote.notes}</p>
        </div>
      ` : ''}
      
      <p>Our team will review your request and contact you within 24-48 hours with a detailed quote tailored to your needs.</p>
      
      <div class="contact-section">
        <h3>Contact Us</h3>
        <div class="contact-info">
          <div class="contact-item">
            <strong>Phone</strong>
            083-989-4082 / 068-078-0301
          </div>
          <div class="contact-item">
            <strong>Email</strong>
            eaglesevents581@gmail.com
          </div>
          <div class="contact-item">
            <strong>Website</strong>
            <a href="https://www.eaglesevents.co.za">www.eaglesevents.co.za</a>
          </div>
          <div class="contact-item">
            <strong>Address</strong>
            7280 Nhlangala Street Protea Glen SOWETO
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://www.eaglesevents.co.za/my-quotes" class="btn">Track Your Quote</a>
      </div>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="https://facebook.com/eaglesevents">Facebook</a> |
        <a href="https://instagram.com/eaglesevents">Instagram</a> |
        <a href="https://twitter.com/eaglesevents">Twitter</a>
      </div>
      <p>&copy; ${new Date().getFullYear()} Eagles Events. All rights reserved.</p>
      <p>This email was sent in response to your quote request.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate HTML template for admin notification email
 * @param {Object} quote - The quote object
 * @param {String} eventDate - Formatted event date
 * @returns {String} HTML email template
 */
export const adminQuoteTemplate = (quote, eventDate) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Request | Eagle Events Admin</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Poppins', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f7fa;
    }
    
    .container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    
    .header {
      background: linear-gradient(135deg, #1a2a6c, #b21f1f);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0;
      font-weight: 600;
      font-size: 28px;
      letter-spacing: 0.5px;
    }
    
    .header p {
      margin-top: 10px;
      font-size: 16px;
      opacity: 0.9;
      background-color: rgba(255, 255, 255, 0.15);
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 15px;
    }
    
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    
    .alert-badge {
      display: inline-block;
      background-color: #e74c3c;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 20px;
    }
    
    .highlight {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #1a2a6c;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .highlight-item {
      flex: 1;
      min-width: 180px;
    }
    
    .highlight-item strong {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .highlight-item span {
      font-size: 18px;
      font-weight: 600;
      color: #1a2a6c;
    }
    
    .price-highlight {
      color: #b21f1f !important;
    }
    
    .section {
      margin: 30px 0;
      padding-bottom: 5px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a2a6c;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0f7ff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background-color: #f0f7ff;
      border-radius: 50%;
      color: #1a2a6c;
    }
    
    .customer-info {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0 25px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
    }
    
    .customer-info-item strong {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .customer-info-item span {
      font-size: 16px;
      color: #333;
    }
    
    .customer-info-item a {
      color: #1a2a6c;
      text-decoration: none;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0 25px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #eaeaea;
    }
    
    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #1a2a6c;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr:nth-child(even) {
      background-color: #fafbfd;
    }
    
    .total-row {
      background-color: #f8f8f8 !important;
      font-weight: 600;
      border-top: 1px solid #D4AF37;
    }
    
    .total-row td {
      color: #000000;
    }
    
    .service-list {
      list-style: none;
      padding: 0;
      margin: 15px 0 25px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    
    .service-list li {
      padding: 10px 15px;
      background-color: #f8fafc;
      border-radius: 6px;
      font-size: 15px;
      border-left: 3px solid #1a2a6c;
    }
    
    .payment-info {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin: 20px 0;
    }
    
    .payment-info-item {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 8px;
    }
    
    .payment-info-item strong {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .payment-info-item span {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    
    .payment-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .status-pending {
      background-color: #ffeaa7;
      color: #d35400;
    }
    
    .status-paid {
      background-color: #d4f8e8;
      color: #27ae60;
    }
    
    .notes-section {
      background-color: #fffdf0;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 3px solid #f39c12;
    }
    
    .notes-section p {
      font-style: italic;
      color: #666;
      margin-top: 10px;
    }
    
    .action-buttons {
      margin: 30px 0;
      text-align: center;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      text-align: center;
      transition: all 0.2s;
      min-width: 160px;
    }
    
    .btn-view {
      background-color: #1a2a6c;
      color: white;
    }
    
    .btn-approve {
      background-color: #27ae60;
      color: white;
    }
    
    .btn-reject {
      background-color: #e74c3c;
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .admin-note {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-top: 30px;
      font-size: 15px;
      border-left: 3px solid #95a5a6;
    }
    
    .footer {
      background-color: #000000;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #ffffff;
      border-top: 2px solid #D4AF37;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      
      .content {
        padding: 20px 15px;
      }
      
      .header {
        padding: 20px 15px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .highlight {
        flex-direction: column;
        gap: 10px;
      }
      
      .customer-info {
        grid-template-columns: 1fr;
      }
      
      .service-list {
        grid-template-columns: 1fr;
      }
      
      table {
        font-size: 14px;
      }
      
      th, td {
        padding: 8px 10px;
      }
      
      .btn {
        width: 100%;
        margin-bottom: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Quote Request</h1>
      <p>REF: ${quote._id}</p>
    </div>
    
    <div class="content">
      <div class="alert-badge">Action Required</div>
      
      <div class="highlight">
        <div class="highlight-item">
          <strong>SUBMITTED</strong>
          <span>${new Date(quote.createdAt).toLocaleString()}</span>
        </div>
        <div class="highlight-item">
          <strong>EVENT DATE</strong>
          <span>${eventDate}</span>
        </div>
        <div class="highlight-item">
          <strong>TOTAL AMOUNT</strong>
          <span class="price-highlight">R${quote.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">
          <span class="section-icon">👤</span> Customer Details
        </h3>
        <div class="customer-info">
          <div class="customer-info-item">
            <strong>Name</strong>
            <span>${quote.customerName}</span>
          </div>
          ${quote.company ? `
          <div class="customer-info-item">
            <strong>Company</strong>
            <span>${quote.company}</span>
          </div>
          ` : ''}
          <div class="customer-info-item">
            <strong>Email</strong>
            <span><a href="mailto:${quote.email}">${quote.email}</a></span>
          </div>
          <div class="customer-info-item">
            <strong>Phone</strong>
            <span>${quote.phone}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">
          <span class="section-icon">🎯</span> Event Details
        </h3>
        <table>
          <tr>
            <th>Event Type</th>
            <td>${quote.eventType}${quote.eventType === 'other' && quote.eventTypeOther ? ` (${quote.eventTypeOther})` : ''}</td>
          </tr>
          <tr>
            <th>Date</th>
            <td>${eventDate}</td>
          </tr>
          <tr>
            <th>Guest Count</th>
            <td>${quote.guestCount}</td>
          </tr>
          <tr>
            <th>Location</th>
            <td>${quote.location}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h3 class="section-title">
          <span class="section-icon">🔧</span> Services Requested
        </h3>
        <ul class="service-list">
          ${quote.services.map(service => `<li>${service}</li>`).join('')}
        </ul>
      </div>
      
      <div class="section">
        <h3 class="section-title">
          <span class="section-icon">🛒</span> Selected Items
        </h3>
        <table>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${quote.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>R${item.price.toFixed(2)}</td>
              <td>R${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <th colspan="3">Total Amount</th>
            <td><strong>R${quote.totalAmount.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="payment-info">
        <div class="payment-info-item">
          <strong>Payment Method</strong>
          <span>${formatPaymentMethod(quote.paymentMethod)}</span>
        </div>
        <div class="payment-info-item">
          <strong>Payment Status</strong>
          <span class="payment-status ${quote.paymentStatus === 'pending' ? 'status-pending' : 'status-paid'}">
            ${quote.paymentStatus.toUpperCase()}
          </span>
        </div>
      </div>
      
      ${quote.notes ? `
        <div class="notes-section">
          <h3 class="section-title">
            <span class="section-icon">📝</span> Customer Notes
          </h3>
          <p>${quote.notes}</p>
        </div>
      ` : ''}
      
      <div class="action-buttons">
        <a href="${process.env.FRONTEND_URL || 'https://eaglesevents.co.za'}/admin/quotes/${quote._id}" class="btn btn-view">View Details</a>
        <a href="${process.env.BACKEND_URL || 'https://api.eaglesevents.co.za'}/api/quotes/${quote._id}/status?action=approve" class="btn btn-approve">Approve Quote</a>
        <a href="${process.env.BACKEND_URL || 'https://api.eaglesevents.co.za'}/api/quotes/${quote._id}/status?action=reject" class="btn btn-reject">Reject Quote</a>
      </div>
      
      <div class="admin-note">
        <strong>Note:</strong> Please log in to the admin panel to manage this quote. You can view full details, make changes to the quote, and communicate with the customer through the admin dashboard.
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Eagles Events. All rights reserved.</p>
      <p>This is an admin notification - do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Format payment method for display
 * @param {String} method - Payment method code
 * @returns {String} Formatted payment method
 */
function formatPaymentMethod(method) {
  const methods = {
    cash: 'Cash Payment',
    eft: 'Electronic Funds Transfer (EFT)'
  };
  return methods[method] || method;
}
