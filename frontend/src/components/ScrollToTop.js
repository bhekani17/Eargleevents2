import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReduced ? 'auto' : 'smooth';

    // If navigating to a hash, try to scroll that element into view
    if (hash) {
      // Use setTimeout to allow the target to render
      const id = hash.replace('#', '');
      const el = document.getElementById(id) || document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior, block: 'start' });
        return;
      }
      // Fallback to top if no element found
    }

    // Default: scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, hash]);

  return null;
}
