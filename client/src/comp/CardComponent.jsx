import React from 'react';
import './CardComponent.css';

// CardComponent: A reusable component to display content with elegant styling.
// It receives props for title, description, and download functionality.
const CardComponent = ({ title, description, onDownload, isDownloading }) => {
  return (
    <div className="card-container">
      {/* Card content section */}
      <div className="card-content">
        {/* Card title with bold text and leading spacing */}
        <h3 className="card-title">
          {title}
        </h3>
        {/* Card description with slightly subdued text color */}
        <p className="card-description">
          {description}
        </p>
      </div>
      {/* Action button at the bottom of the card */}
      <div className="card-button-container">
        <button 
          onClick={onDownload}
          disabled={isDownloading}
          className={`card-button ${isDownloading ? 'downloading' : ''}`}
        >
          {isDownloading ? (
            <span className="button-content">
              <span className="loading-spinner"></span>
              Downloading...
            </span>
          ) : (
            <span className="button-content">
              <svg className="download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CardComponent;