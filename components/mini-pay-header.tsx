import { ArrowLeft, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MiniPayHeader() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 max-w-md">
        <Button variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1">
          <h2 className="text-sm font-medium">MiniLend by Pesabits</h2>
        </div>
        <Button variant="ghost" size="icon">
          <BellRing className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
