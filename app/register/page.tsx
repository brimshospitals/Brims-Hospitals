import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-teal-600 text-xl">Loading...</div>}>
      <RegisterClient />
    </Suspense>
  );
}