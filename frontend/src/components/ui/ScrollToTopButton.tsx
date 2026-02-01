import { useState, useEffect, useCallback } from "react";

interface ScrollToTopButtonProps {
  threshold?: number; // Scroll distance (px) before showing button
}

/**
 * ScrollToTopButton - Fixed button in bottom-right to scroll back to top
 */
const ScrollToTopButton = ({ threshold = 300 }: ScrollToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Check scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    // Add throttling to improve performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    
    // Check initial position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className="scroll-to-top-btn"
      onClick={scrollToTop}
      aria-label="Torna in alto"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;
