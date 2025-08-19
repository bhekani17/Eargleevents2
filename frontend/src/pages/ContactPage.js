import { Contact } from '../components/Contact';

export function ContactPage({ onQuoteClick }) {
  return (
    <div className="pt-20">
      <Contact onQuoteClick={onQuoteClick} />
    </div>
  );
}
