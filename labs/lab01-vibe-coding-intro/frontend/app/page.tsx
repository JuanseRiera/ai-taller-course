import { HomeClient } from '@/features/shorten/HomeClient';
import { LinksTable } from '@/features/table/LinksTable';

export default async function Home({
  searchParams,
}: {
  searchParams: { limit?: string; offset?: string };
}) {
  const limit = parseInt(searchParams.limit || '5');
  const offset = parseInt(searchParams.offset || '0');

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-4xl space-y-12 mt-10">
        <HomeClient />

        <LinksTable offset={offset} limit={limit} />
      </div>
    </main>
  );
}
