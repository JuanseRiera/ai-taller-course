"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success';
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const styles = {
    error: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-800 dark:text-red-200",
      icon: "text-red-400"
    },
    success: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-800 dark:text-green-200",
      icon: "text-green-400"
    }
  };

  const currentStyle = styles[type];

  return (
    <div className={`rounded-md p-4 ${currentStyle.bg}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={`h-5 w-5 ${currentStyle.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${currentStyle.text}`}>{message}</h3>
        </div>
      </div>
    </div>
  );
};
