import { Card } from "@/components/ui/card";

export default function MiniPayRequired() {
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">MiniPay Required</h1>
        <p>
          This application can only be accessed through the MiniPay app. Please
          open this link in MiniPay.
        </p>
      </Card>
    </div>
  );
}
