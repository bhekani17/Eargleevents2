import { About } from '../components/About';

export function AboutPage({ onQuoteClick }) {
  return (
    <div className="pt-20">
      <About onQuoteClick={onQuoteClick} />
    </div>
  );
}
