import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';

export function ImageCarousel({ slides, onQuoteClick, autoPlay = false, interval = 5000 }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Index for rotating images within a single slide when slide.images is present
  const [currentInnerIndex, setCurrentInnerIndex] = useState(0);
  const slidesLength = useMemo(() => slides?.length || 0, [slides]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slidesLength);
  }, [slidesLength]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slidesLength) % slidesLength);
  }, [slidesLength]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!autoPlay || isPaused || !slidesLength) return;

    const timer = setInterval(() => {
      nextSlide();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isPaused, nextSlide, slidesLength]);

  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Reset inner image index when changing slides
  useEffect(() => {
    setCurrentInnerIndex(0);
  }, [currentSlide]);

  // Auto-rotate inner images for the active slide if it has multiple images
  useEffect(() => {
    if (!autoPlay || isPaused || !slidesLength) return;
    const activeSlide = slides[currentSlide];
    const innerLen = (activeSlide?.images?.length || 0);
    if (innerLen <= 1) return;

    const innerTimer = setInterval(() => {
      setCurrentInnerIndex(prev => (prev + 1) % innerLen);
    }, Math.max(2000, Math.floor(interval / 2)));

    return () => clearInterval(innerTimer);
  }, [autoPlay, isPaused, slides, slidesLength, currentSlide, interval]);

  if (!slides || slides.length === 0) {
    return (
      <div 
        className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
        role="alert"
        aria-label="No slides available"
      >
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
      aria-live={isPaused ? 'off' : 'polite'}
    >
      {/* Slides - Crossfade */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out will-change-[opacity] ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {(() => {
              const images = (slide?.images && slide.images.length > 0)
                ? slide.images
                : (slide?.image ? [slide.image] : []);
              const imgSrc = images.length
                ? images[index === currentSlide ? (currentInnerIndex % images.length) : 0]
                : '/images/placeholder.jpg';
              return (
                <LazyLoadImage
                  src={imgSrc}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  effect="opacity"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  placeholderSrc="/images/placeholder.jpg"
                />
              );
            })()}
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
            {/* Slide content */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center text-white max-w-4xl px-4">
                {slide.subtitle && (
                  <h2 className="text-xs sm:text-sm uppercase tracking-wide mb-1 sm:mb-2 opacity-90">
                    {slide.subtitle}
                  </h2>
                )}
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 leading-tight">
                  {slide.title}
                </h1>
                {slide.description && (
                  <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto text-white line-clamp-2 md:line-clamp-3">
                    {slide.description}
                  </p>
                )}
                <Button
                  onClick={onQuoteClick}
                  size="lg"
                  className="bg-gold-600 hover:bg-gold-700 text-black font-semibold px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-sm sm:text-base"
                  aria-label={slide.ctaText || 'Get a quote'}
                >
                  {slide.ctaText || 'Get Started'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div 
          className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 sm:space-x-2"
          role="tablist"
          aria-label="Slide navigation"
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              role="tab"
              aria-selected={index === currentSlide}
              aria-label={`Slide ${index + 1} of ${slides.length}`}
              aria-controls={`slide-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
