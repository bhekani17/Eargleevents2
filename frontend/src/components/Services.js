import { Truck, Gift, Utensils, Settings } from 'lucide-react';
import { Button } from './ui/button';

export function Services({ onQuoteClick }) {
  const services = [
    {
      id: 'mobile-hire',
      icon: Truck,
      title: 'Mobile Hire Services',
      description: 'Comprehensive mobile solutions for all types of events including VIP toilets, tents, and other essential facilities.',
      features: ['VIP Mobile Toilets', 'Tents & Marquees', 'Event Equipment', 'Professional Setup'],
      image: '/images/TOILET2.webp'
    },
    {
      id: 'event-packages',
      icon: Gift,
      title: 'Event Packages',
      description: 'Tailored packages for weddings, funerals, birthdays, and corporate events to suit your specific needs.',
      features: ['Customizable Options', 'All-inclusive Deals', 'Professional Planning', 'Budget Friendly'],
      image: '/images/home3.webp'
    },
    {
      id: 'slaughtering-services',
      icon: Utensils,
      title: 'Slaughtering Services',
      description: 'Professional and hygienic mobile slaughtering services for all your event requirements.',
      features: ['Mobile Units', 'Health Compliant', 'Professional Staff', 'Quality Assurance'],
      image: '/images/sla.jpg'
    },
    {
      id: 'auxiliary-services',
      icon: Settings,
      title: 'Auxiliary Services',
      description: 'Additional services to ensure your event runs smoothly from start to finish.',
      features: ['Waste Management', 'Water Supply', 'Power Solutions', 'Event Cleanup'],
      image: '/images/v1.webp'
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We ensure your event is seamless with our comprehensive mobile services, offering perfect hospitality and hygiene for your guests.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.id}
                id={service.id}
                className={`flex flex-col lg:flex-row items-center bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2 h-48 sm:h-64 lg:h-80">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center mr-4">
                      <IconComponent className="w-6 h-6 text-gold-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{service.title}</h3>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{service.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm sm:text-base text-gray-700">
                        <div className="w-2 h-2 bg-gold-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => onQuoteClick({ preSelectedItem: { type: 'service', name: service.title } })}
                    className="bg-gold-600 hover:bg-gold-700 text-black font-semibold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                  >
                    Request This Service
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gray-50 rounded-xl p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            Need a Custom Solution?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
            Don't see exactly what you need? Our team can create custom solutions tailored to your specific requirements. 
            Contact us for a personalized consultation.
          </p>
          <Button
            onClick={onQuoteClick}
            className="bg-gold-600 hover:bg-gold-700 text-black font-semibold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
          >
            Get Custom Quote
          </Button>
        </div>
      </div>
    </section>
  );
}
