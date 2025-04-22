import { ProtectedRoute } from "@/components/protected-route"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
