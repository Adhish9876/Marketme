import Stack from "@/components/fancy/stack";

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Stack />
      </div>
    </div>
  );
}
