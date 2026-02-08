'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/shared/ui/Button';

interface LoadMoreButtonProps {
  limit: number;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ limit }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    startTransition(() => {
      router.replace(`/?limit=${limit}`, { scroll: false });
    });
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLoadMore}
      isLoading={isPending}
      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
    >
      Load More
    </Button>
  );
};
