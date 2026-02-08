'use client';

import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { ShortenedLink } from './lib/models';

interface LinksTableClientProps {
  links: ShortenedLink[];
}

export const LinksTableClient: React.FC<LinksTableClientProps> = ({ links }) => {
  const [copiedLinkCode, setCopiedLinkCode] = useState<string | null>(null);

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkCode(code);
    setTimeout(() => setCopiedLinkCode(null), 2000);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
            <th className="px-6 py-3">Original URL</th>
            <th className="px-6 py-3">Short URL</th>
            <th className="px-6 py-3">Code</th>
            <th className="px-6 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {links.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                No links created yet.
              </td>
            </tr>
          ) : (
            links.map((link) => (
              <tr key={link.short_code} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 max-w-xs truncate" title={link.original_url}>
                  {link.original_url}
                </td>
                <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-medium">
                  <a href={link.short_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                    {link.short_url} <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                    {link.short_code}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleCopy(link.short_url, link.short_code)}
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Copy Link"
                  >
                    {copiedLinkCode === link.short_code ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
