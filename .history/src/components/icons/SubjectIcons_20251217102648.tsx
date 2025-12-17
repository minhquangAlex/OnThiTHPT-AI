
import React from 'react';

export const MathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4v16m-4-10l8 8m0-8l-8 8" />
  </svg>
);

export const EnglishIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m0 16v-2m-6 2h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2zM17 9h4" />
  </svg>
);

export const PhysicsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20.5c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3.08c0-.1.04-.2.1-.28l1.8-1.8c.16-.16.2-.4.1-.6l-1.6-3.2c-.07-.16-.24-.24-.4-.24H9.5c-.16 0-.33.08-.4.24l-1.6 3.2c-.1.2-.06.44.1.6l1.8 1.8c.06.07.1.17.1.28V20.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m-6.36 1.64l1.41 1.41M3 12h2m1.64 6.36l1.41-1.41M12 21v-2m6.36-1.64l-1.41-1.41M21 12h-2m-1.64-6.36l-1.41 1.41" />
    </svg>
);

export const ChemistryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4H7zm0 0l8-8m-8 8V5m8 8h.01M12 12h.01M16 12h.01M16 8V5" />
  </svg>
);

export const BiologyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c-2.343 2.343-2.343 6.136 0 8.485 2.343-2.343 2.343-6.136 0-8.485zm-4.95-4.95A7.5 7.5 0 0012 21a7.5 7.5 0 004.95-14.95" />
  </svg>
);

export const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13c-1.168.776-2.754 1.253-4.5 1.253s-3.332-.477-4.5-1.253" />
  </svg>
);