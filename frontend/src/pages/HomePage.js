
import { Hero } from '../components/Hero';
import { Services } from '../components/Services';
import { About } from '../components/About';
import { Contact } from '../components/Contact';

export function HomePage({ onQuoteClick }) {

  return (
    <div>
      <Hero onQuoteClick={onQuoteClick} />
      <Services onQuoteClick={onQuoteClick} />
      <About onQuoteClick={onQuoteClick} />
      <Contact onQuoteClick={onQuoteClick} />
    </div>
  );
}
