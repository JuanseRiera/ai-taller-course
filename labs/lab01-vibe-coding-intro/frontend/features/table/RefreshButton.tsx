'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/shared/ui/Button';

export const RefreshButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleRefresh}
      isLoading={isPending}
      className="text-sm font-medium"
    >
      Refresh
    </Button>
  );
};
