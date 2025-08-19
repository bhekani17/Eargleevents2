import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Sitemap() {
  const siteStructure = {
    mainPages: [
      { name: 'Home', path: '/', description: 'Welcome to Eagles Events' },
      { name: 'Services', path: '/services', description: 'Our premium event services' },
      { name: 'Packages', path: '/packages', description: 'Event packages and deals' },
      { name: 'Hire Equipment', path: '/hire', description: 'Equipment rental services' },
      { name: 'About Us', path: '/about', description: 'Learn about our company' },
      { name: 'Contact', path: '/contact', description: 'Get in touch with us' }
    ],
    services: [
      { name: 'VIP Mobile Toilets', path: '/services#toilets', description: 'Luxury portable facilities' },
      { name: 'Mobile Freezers', path: '/services#freezers', description: 'Professional cold storage' },
      { name: 'Tents & Marquees', path: '/services#tents', description: 'Weather-resistant structures' },
      { name: 'Slaughtering Services', path: '/services#slaughtering', description: 'Professional meat processing' }
    ],
    adminPages: [
      { name: 'Admin Login', path: '/admin/login', description: 'Admin portal access' },
      { name: 'Dashboard', path: '/admin/dashboard', description: 'Admin dashboard' },
      { name: 'Quotes', path: '/admin/quotes', description: 'Manage quotations' },
      { name: 'Bookings', path: '/admin/bookings', description: 'Manage bookings' },
      { name: 'Customers', path: '/admin/customers', description: 'Customer management' },
      { name: 'Packages', path: '/admin/packages', description: 'Package management' },
      { name: 'Equipment', path: '/admin/equipment', description: 'Equipment management' }
    ]
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Site Map</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Navigate through all pages and sections of the Eagles Events website
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Main Pages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Pages</h3>
            <ul className="space-y-3">
              {siteStructure.mainPages.map((page) => (
                <li key={page.path}>
                  <Link
                    to={page.path}
                    className="text-gray-600 hover:text-gold-600 transition-colors block"
                  >
                    <div className="font-medium">{page.name}</div>
                    <div className="text-sm text-gray-500">{page.description}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Services</h3>
            <ul className="space-y-3">
              {siteStructure.services.map((service) => (
                <li key={service.path}>
                  <Link
                    to={service.path}
                    className="text-gray-600 hover:text-gold-600 transition-colors block"
                  >
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500">{service.description}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin Pages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Portal</h3>
            <ul className="space-y-3">
              {siteStructure.adminPages.map((page) => (
                <li key={page.path}>
                  <Link
                    to={page.path}
                    className="text-gray-600 hover:text-gold-600 transition-colors block"
                  >
                    <div className="font-medium">{page.name}</div>
                    <div className="text-sm text-gray-500">{page.description}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gold-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Phone</div>
                <div className="text-gray-600">+27 123 456 789</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gold-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Email</div>
                <div className="text-gray-600">info@eaglesevents.com</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gold-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Address</div>
                <div className="text-gray-600">123 Event Street, Cape Town</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gold-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Hours</div>
                <div className="text-gray-600">Mon-Fri: 8AM-6PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 