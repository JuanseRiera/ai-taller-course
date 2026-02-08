'use client';

import React, { useState, useEffect } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface SuccessResultProps {
  shortUrl: string;
  onClear: () => void;
}

export const SuccessResult: React.FC<SuccessResultProps> = ({ shortUrl, onClear }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shortUrl) {
      const timer = setTimeout(() => {
        onClear();
        setCopied(false);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [shortUrl, onClear]);

  const copyToClipboard = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shortUrl) return null;

  return (
    <div className="mt-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
      <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Success! Here's your short URL:</h3>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shortUrl}
          className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
        />
        <Button
          onClick={copyToClipboard}
          variant="secondary"
          title="Copy to clipboard"
          className="px-3"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <Clipboard className="h-5 w-5 text-gray-500 dark:text-gray-300" />
          )}
        </Button>
      </div>
    </div>
  );
};
