import React from 'react';

interface AffiliateBannerProps {
  className?: string;
}

export function AffiliateBanner({ className = '' }: AffiliateBannerProps) {
  return (
    <div className={`affiliate-banner-container ${className}`}>
      {/* Chess Store Banner - Dynamic width for both mobile and desktop */}
      <div className="w-full">
        <a 
          href="https://www.linkconnector.com/ta.php?lc=168677140131005057&lcpt=0&lcpf=3" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full"
        >
          <img 
            style={{ border: '0px' }} 
            src="/affiliate-banners/chessstorebanner.png" 
            alt="The Chess Store - Chess Sets, Personalized Sets, Clocks"
            className="w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            loading="lazy"
          />
          <img 
            src="https://www.linkconnector.com/traffic_record.php?lc=168677140131005057" 
            border="0" 
            width="1" 
            height="1" 
            alt=""
            style={{ display: 'none' }}
          />
        </a>
      </div>
    </div>
  );
}
