import { Award, Users, Clock, Shield } from 'lucide-react';
import { Button } from './ui/button';

export function About({ onQuoteClick }) {
  const stats = [
    { icon: Users, label: 'Satisfied Clients', value: '1,000+' },
    { icon: Award, label: 'Events Served', value: '300+' },
    { icon: Clock, label: 'Years in Business', value: '3+' },
    { icon: Shield, label: 'Service Areas', value: 'Gauteng' }
  ];

  const values = [
    {
      title: 'Commitment to Excellence',
      description: 'We deliver top-quality mobile hire services with attention to detail and professionalism.',
      icon: Award
    },
    {
      title: 'Reliability',
      description: 'Count on us to be on time, every time, with reliable equipment and services.',
      icon: Clock
    },
    {
      title: 'Customer Satisfaction',
      description: 'Your event\'s success is our priority. We go above and beyond to exceed expectations.',
      icon: Users
    },
    {
      title: 'Hygiene & Safety',
      description: 'We maintain the highest standards of cleanliness and safety in all our services.',
      icon: Shield
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            About Eagles Events
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Based in Soweto, we specialize in providing top-quality mobile hire services and slaughtering solutions for all types of events. 
            Our commitment to excellence and customer satisfaction sets us apart in the industry.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Image */}
          <div className="relative">
            <img
              src="/images/f9.webp"
              alt="Eagles Events team"
              className="rounded-xl shadow-lg w-full h-96 object-cover"
            />
            <div className="absolute inset-0 bg-blue-600 bg-opacity-10 rounded-xl"></div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Excellence in Event Services Since 2019
            </h3>
            <p className="text-gray-600 mb-6">
              Eagles Events was founded with a simple mission: to provide exceptional event services 
              that exceed our clients' expectations. What started as a small family business has grown 
              into one of South Africa's most trusted event service providers.
            </p>
            <p className="text-gray-600 mb-6">
              We specialize in premium VIP mobile toilets, professional-grade mobile freezers, 
              weather-resistant tents and marquees, and compliant slaughtering services. Our team 
              is committed to delivering quality, reliability, and outstanding customer service.
            </p>
            <p className="text-gray-600 mb-8">
              Whether you're planning a wedding, corporate event, festival, or private celebration, 
              we have the expertise and equipment to make your event a success.
            </p>
            <Button
              onClick={onQuoteClick}
              className="bg-gold-600 hover:bg-gold-700 text-black font-semibold"
            >
              Work With Us
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-black" />
                  </div>
                </div>
                <h4 className="text-2xl sm:text-3xl font-bold text-black mb-2">{stat.value}</h4>
                <p className="text-sm sm:text-base text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Values with B&W background */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Background image (black & white) */}
          <img
            src="/images/t6.webp"
            alt="Event background"
            className="absolute inset-0 w-full h-full object-cover filter grayscale"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black bg-opacity-60" />

          <div className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-14">
            <h3 className="text-3xl font-bold text-white text-center mb-12">
              Our Core Values
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <div
                    key={index}
                    className="text-center bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-white/20"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-gold-600" />
                      </div>
                    </div>
                    <h4 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">{value.title}</h4>
                    <p className="text-sm sm:text-base text-gray-100">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
