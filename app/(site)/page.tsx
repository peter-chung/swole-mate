import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="relative isolate grid min-h-[calc(100vh-3.5rem)] grid-cols-1 items-center py-10 sm:py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center md:max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
            Build strength. Track progress. Stay consistent.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg dark:text-gray-300">
            Swole Mate is your lightweight workout companion. Create workouts,
            log exercises, and watch your gains over time.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-base font-medium text-white shadow hover:bg-gray-800 sm:w-auto dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              Get started
            </Link>
            <Link
              href="/workouts"
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 sm:w-auto dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              Browse workouts
            </Link>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <li className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
              <p className="font-medium text-gray-900 dark:text-white">Fast logging</p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">Add sets and reps in seconds.</p>
            </li>
            <li className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
              <p className="font-medium text-gray-900 dark:text-white">Flexible workouts</p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">Customize exercises and routines.</p>
            </li>
            <li className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
              <p className="font-medium text-gray-900 dark:text-white">Realtime updates</p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">Stay in sync across devices.</p>
            </li>
          </ul>
        </div>

        <div className="pointer-events-none absolute inset-x-0 -z-10 mx-auto hidden h-64 w-[90%] blur-3xl sm:block">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-400/30 via-purple-400/30 to-pink-400/30 dark:from-indigo-700/20 dark:via-purple-700/20 dark:to-pink-700/20" />
        </div>
      </section>
    </div>
  );
}
