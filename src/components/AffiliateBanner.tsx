import React from 'react';

interface AffiliateBannerProps {
  className?: string;
}

export function AffiliateBanner({ className = '' }: AffiliateBannerProps) {
  return (
    <div className={`affiliate-banner-container ${className}`}>
      {/* Mobile Banner - 728x90 - Hidden on desktop */}
      <div className="block lg:hidden">
        <a 
          href="https://chess-teacher.com/affiliates/idevaffiliate.php?id=2999_125_1_72" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full"
        >
          <img 
            style={{ border: '0px' }} 
            src="/affiliate-banners/Masterclass-728x90.jpg" 
            width="728" 
            height="90" 
            alt="Free Chess Masterclass - Improve at Chess Instantly!"
            className="w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          />
        </a>
      </div>

      {/* Desktop Banner - 336x280 - Hidden on mobile */}
      <div className="hidden lg:block">
        <a 
          href="https://chess-teacher.com/affiliates/idevaffiliate.php?id=2999_125_1_71" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <img 
            style={{ border: '0px' }} 
            src="/affiliate-banners/Masterclass-336x280.jpg" 
            width="336" 
            height="280" 
            alt="Free Chess Masterclass - Improve at Chess Instantly!"
            className="w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          />
        </a>
      </div>
    </div>
  );
}
