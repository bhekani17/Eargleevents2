import { Services } from '../components/Services';

export function ServicesPage({ onQuoteClick }) {
  return (
    <div className="pt-20">
      <Services onQuoteClick={onQuoteClick} />
    </div>
  );
}
