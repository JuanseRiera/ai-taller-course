import React from 'react';
import { getLinks } from './lib/api';
import { LinksTableClient } from './LinksTableClient';
import { RefreshButton } from './RefreshButton';
import { LoadMoreButton } from './LoadMoreButton';

interface LinksTableProps {
  limit: number;
  offset: number;
}

export const LinksTable: React.FC<LinksTableProps> = async ({ 
  limit, 
  offset
}) => {
  const links = await getLinks(limit, offset);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Latest Short Links</h2>
        <RefreshButton />
      </div>
      
      <LinksTableClient links={links} />

      {links.length > 0 && links.length === limit && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 text-center border-t border-gray-100 dark:border-gray-700">
          <LoadMoreButton limit={limit + 5} />
        </div>
      )}
    </div>
  );
};
