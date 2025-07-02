import { useEffect, useRef, useState } from "react";
import CardComponent from "./CardComponent";

// Simple Lazy Card Component - no separate API calls needed
const LazyCardComponent = ({ book, onDownload, isDownloading }) => {
  const [cardRef, setCardRef] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible
          if (observerRef.current && cardRef) {
            observerRef.current.unobserve(cardRef);
          }
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start showing 100px before coming into view
      }
    );

    if (cardRef && observerRef.current) {
      observerRef.current.observe(cardRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [cardRef]);

  // Skeleton component
  const SkeletonCard = () => (
    <div className="card-container skeleton-card">
      <div className="card-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
      </div>
      <div className="card-button-container">
        <div className="skeleton-button"></div>
      </div>
    </div>
  );

  return (
    <div ref={setCardRef}>
      {isVisible ? (
        <CardComponent
          title={book.title}
          description={
            <>
              صنفه {book.author}
              <br />
              {book.pages && `${book.pages} صفحة`}
            </>
          }
          onDownload={onDownload}
          isDownloading={isDownloading}
        />
      ) : (
        <SkeletonCard />
      )}
    </div>
  );
};

export default LazyCardComponent;