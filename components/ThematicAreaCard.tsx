import React from 'react';
import { ThematicArea } from '../types';

const GeometricBackground: React.FC = () => {
  // A geometric triangle pattern inspired by the user's image.
  // Using an inline SVG data URI for the background is efficient and flexible.
  const svgPattern = `
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
      <path fill='rgba(255,255,255,0.05)' d='M0 0 L40 0 L0 40 Z'/>
      <path fill='rgba(255,255,255,0.08)' d='M40 40 L40 0 L0 40 Z'/>
    </svg>
  `;
  // Using encodeURIComponent is safer for embedding in a data URI.
  const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svgPattern)}`;

  return (
    <div
      className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-110"
      style={{
        backgroundImage: `url("${encodedSvg}")`,
      }}
      aria-hidden="true"
    />
  );
};

interface ThematicAreaCardProps {
  area: ThematicArea;
  onSelect: () => void;
  isSubmitted: boolean;
}

const ThematicAreaCard: React.FC<ThematicAreaCardProps> = ({ area, onSelect, isSubmitted }) => {
  const isInformationExpected = area.id === 1 || area.id === 9;

  let bgClass = `bg-[#0055A4] hover:bg-[#004488]`;
  let cardBorderClass = 'border-transparent';
  let textClass = 'text-white';

  if (isSubmitted) {
    bgClass = 'bg-green-600 hover:bg-green-700';
    cardBorderClass = 'border-green-700';
  } else if (isInformationExpected) {
    bgClass = 'bg-yellow-500 hover:bg-yellow-600';
    cardBorderClass = 'border-yellow-600';
  }

  const cardClasses = `
    group
    rounded-lg shadow-lg hover:shadow-xl 
    transition-all duration-300 cursor-pointer 
    h-48 md:h-56 lg:h-64
    relative overflow-hidden
    transform hover:scale-105
    border-2 ${cardBorderClass}
    ${bgClass}
    p-6 flex flex-col justify-end
  `;

  const titleClasses = `
    text-xl font-bold ${textClass} mb-2
    drop-shadow-sm z-10
  `;
  
  const accessibilityStatus = isSubmitted 
    ? '(Submitted)' 
    : (isInformationExpected ? '(Information Expected)' : '');

  return (
    <div 
      className={cardClasses}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      aria-label={`Access questionnaire for ${area.title} ${accessibilityStatus}`}
    >
      <GeometricBackground />
      <h3 className={titleClasses}>
        {area.id}. {area.title}
      </h3>
    </div>
  );
};

export default ThematicAreaCard;