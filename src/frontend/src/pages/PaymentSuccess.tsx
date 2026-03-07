import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate({ to: "/" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900/20 w-fit">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-base mt-2">
            Thank you for subscribing to Full Throttle Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your subscription has been activated successfully. You now have
              access to all premium features!
            </p>
            <div className="p-4 bg-primary/10 rounded-lg mt-4">
              <p className="text-sm font-medium">Premium Features Unlocked:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✓ Realistic F1 racing</li>
                <li>✓ Online multiplayer</li>
                <li>✓ Group racing & tournaments</li>
                <li>✓ Enhanced graphics & physics</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate({ to: "/" })}
            >
              Start Racing Now
            </Button>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting in {countdown} seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
