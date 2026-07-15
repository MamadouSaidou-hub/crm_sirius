import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware sends unauthenticated users to /login.
  redirect("/dashboard");
}
