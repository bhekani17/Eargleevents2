import { Button } from './ui/button';

export function HireNowBanner({ onQuoteClick }) {
  const items = [
    {
      id: 'vip-toilets',
      emoji: '🚻',
      title: 'VIP Mobile Toilets',
      description: 'Premium, hygienic portable toilets for any event size.',
      serviceName: 'VIP Mobile Toilets',
    },
    {
      id: 'mobile-freezer',
      emoji: '❄️',
      title: 'Mobile Freezer',
      description: 'Reliable mobile cold storage for food and beverages.',
      serviceName: 'Mobile Freezers',
    },
    {
      id: 'tents',
      emoji: '⛺',
      title: 'Tents',
      description: 'Quality tents and marquees tailored to your venue.',
      serviceName: 'Tents & Marquees',
    },
    {
      id: 'slaughtering',
      emoji: '🐄',
      title: 'Slaughtering Services',
      description: 'Professional on-site slaughtering, compliant and hygienic.',
      serviceName: 'Slaughtering Services',
    },
  ];

  return (
    <section className="bg-white py-12 border-t border-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Hire Now</h2>
          <p className="text-gold-700 mt-2">Fast, reliable services for your next event</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white border border-gold-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-5xl mb-4" aria-hidden>
                {item.emoji}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-6">{item.description}</p>
              <Button
                onClick={() => onQuoteClick?.({ preSelectedItem: { type: 'service', name: item.serviceName } })}
                className="w-full bg-gold-600 hover:bg-gold-700 text-black font-semibold"
              >
                Hire Now
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
