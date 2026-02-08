'use client';

import { useState } from 'react';
import { ShortenForm } from './ShortenForm';
import { SuccessResult } from './SuccessResult';

export const HomeClient = () => {
  const [shortUrl, setShortUrl] = useState('');

  return (
    <div className="max-w-md mx-auto w-full p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">URL Shortener</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Enter your long URL below to get a short link.
        </p>
      </div>

      <ShortenForm onSuccess={(url) => setShortUrl(url)} />

      <SuccessResult 
        shortUrl={shortUrl} 
        onClear={() => setShortUrl('')} 
      />
    </div>
  );
};
