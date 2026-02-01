import { useState, useRef, useCallback, useEffect } from "react";

interface Photo {
  url: string;
  label: string;
}

interface PhotoCarouselProps {
  photos: Photo[];
  className?: string;
}

/**
 * PhotoCarousel - Carousel immagini swipeable per mobile
 * Supporta swipe touch e navigazione con frecce
 */
const PhotoCarousel = ({ photos, className = "" }: PhotoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    setDragOffset(currentTouch - touchStart);
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset(0);
    
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, currentIndex, photos.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(photos.length - 1, prev + 1));
  }, [photos.length]);

  // Handle keyboard navigation in fullscreen
  useEffect(() => {
    if (fullscreenIndex === null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenIndex(null);
      } else if (e.key === "ArrowLeft" && fullscreenIndex > 0) {
        setFullscreenIndex(prev => (prev !== null ? prev - 1 : null));
      } else if (e.key === "ArrowRight" && fullscreenIndex < photos.length - 1) {
        setFullscreenIndex(prev => (prev !== null ? prev + 1 : null));
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [fullscreenIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <div className={`photo-carousel photo-carousel--empty ${className}`}>
        <div className="photo-carousel__placeholder">
          <span className="photo-carousel__placeholder-icon">📷</span>
          <span>Nessuna foto disponibile</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`photo-carousel ${className}`} ref={containerRef}>
        {/* Main slider */}
        <div 
          className="photo-carousel__slider"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="photo-carousel__track"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${isDragging ? dragOffset : 0}px))`,
              transition: isDragging ? "none" : "transform 0.3s ease-out"
            }}
          >
            {photos.map((photo, index) => (
              <div 
                key={index} 
                className="photo-carousel__slide"
                onClick={() => setFullscreenIndex(index)}
              >
                <img 
                  src={photo.url} 
                  alt={photo.label}
                  className="photo-carousel__image"
                  draggable={false}
                />
                <div className="photo-carousel__label">{photo.label}</div>
              </div>
            ))}
          </div>
          
          {/* Navigation arrows - hide on mobile */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="photo-carousel__nav photo-carousel__nav--prev"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                disabled={currentIndex === 0}
                aria-label="Foto precedente"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className="photo-carousel__nav photo-carousel__nav--next"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                disabled={currentIndex === photos.length - 1}
                aria-label="Foto successiva"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {photos.length > 1 && (
          <div className="photo-carousel__dots">
            {photos.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`photo-carousel__dot ${index === currentIndex ? "photo-carousel__dot--active" : ""}`}
                onClick={() => goToSlide(index)}
                aria-label={`Vai alla foto ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="photo-carousel__thumbnails">
            {photos.map((photo, index) => (
              <button
                key={index}
                type="button"
                className={`photo-carousel__thumb ${index === currentIndex ? "photo-carousel__thumb--active" : ""}`}
                onClick={() => goToSlide(index)}
              >
                <img src={photo.url} alt={photo.label} draggable={false} />
              </button>
            ))}
          </div>
        )}

        {/* Counter badge */}
        <div className="photo-carousel__counter">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreenIndex !== null && (
        <div 
          className="photo-carousel__fullscreen"
          onClick={() => setFullscreenIndex(null)}
        >
          <button
            type="button"
            className="photo-carousel__fullscreen-close"
            onClick={() => setFullscreenIndex(null)}
            aria-label="Chiudi"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <img 
            src={photos[fullscreenIndex].url} 
            alt={photos[fullscreenIndex].label}
            className="photo-carousel__fullscreen-image"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="photo-carousel__fullscreen-label">
            {photos[fullscreenIndex].label}
          </div>
          
          {fullscreenIndex > 0 && (
            <button
              type="button"
              className="photo-carousel__fullscreen-nav photo-carousel__fullscreen-nav--prev"
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex(prev => (prev !== null ? prev - 1 : null)); }}
              aria-label="Foto precedente"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          
          {fullscreenIndex < photos.length - 1 && (
            <button
              type="button"
              className="photo-carousel__fullscreen-nav photo-carousel__fullscreen-nav--next"
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex(prev => (prev !== null ? prev + 1 : null)); }}
              aria-label="Foto successiva"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default PhotoCarousel;
