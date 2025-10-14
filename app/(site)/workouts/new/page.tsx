import CreateWorkoutForm from "../_components/CreateWorkoutForm";

const Page = () => {
  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Create Workout
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Set a name, date, and optional notes to get started.
          </p>
        </div>

        <div className="mt-6">
          <CreateWorkoutForm />
        </div>
      </div>
    </div>
  );
};

export default Page;
