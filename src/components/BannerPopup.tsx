import React from 'react';
import { X } from 'lucide-react';

interface BannerPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BannerPopup({ isOpen, onClose }: BannerPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 lg:p-4">
      <div className="card w-full max-w-sm sm:max-w-md lg:max-w-lg relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 text-slate-400 hover:text-slate-200 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="p-4 sm:p-5 lg:p-6">
          <div className="text-center mb-4 sm:mb-5">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--color-text)' }}>
              Special Offer Available!
            </h2>
            <p className="text-sm sm:text-base" style={{ color: 'var(--color-text-muted)' }}>
              Check out our exclusive chess courses promotion
            </p>
          </div>

          {/* Banner Image with Affiliate Link - Exact HTML, Untouched */}
          <div className="w-full mb-4 sm:mb-5">
            <a 
              href="https://chess-teacher.com/affiliates/idevaffiliate.php?id=2999_26_3_31" 
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <img 
                src="/affiliate-banners/chessdaily-300x250.png" 
                alt="Chess Daily - 70% Off Today Only"
                className="w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                style={{ border: '0px' }}
                width="300"
                height="250"
              />
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full btn-secondary py-3 sm:py-3.5 font-semibold text-sm sm:text-base lg:text-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

