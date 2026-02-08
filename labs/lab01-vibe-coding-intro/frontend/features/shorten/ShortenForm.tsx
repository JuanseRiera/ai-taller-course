'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Alert } from '@/shared/ui/Alert';
import { shortenUrlAction } from './lib/actions';

interface ShortenFormProps {
  onSuccess: (shortUrl: string) => void;
}

export const ShortenForm: React.FC<ShortenFormProps> = ({ onSuccess }) => {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await shortenUrlAction({ url, customCode });

    if (result.success && result.data) {
      setUrl('');
      setCustomCode('');
      onSuccess(result.data.short_url);
    } else {
      setError(result.error || 'Something went wrong');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <Input 
          id="url"
          label="URL"
          type="url"
          required
          placeholder="https://example.com/very-long-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Input 
          id="custom-code"
          label="Custom Code (Optional)"
          type="text"
          placeholder="Custom alias (optional)"
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
        />
      </div>

      <div>
        <Button 
          type="submit" 
          disabled={loading} 
          isLoading={loading}
          className="w-full"
        >
          {loading ? "Shortening..." : "Shorten URL"}
        </Button>
      </div>
      
      {error && <Alert type="error" message={error} />}
    </form>
  );
};
