import CreateRoutineForm from "../_components/CreateRoutineForm";

export const dynamic = "force-dynamic";

export default function NewRoutinePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Create Routine</h1>
      <CreateRoutineForm />
    </div>
  );
}
