import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-red-100 dark:bg-red-900/20 w-fit">
            <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-base mt-2">
            Your subscription payment was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              No charges were made to your account. You can try again whenever you're ready.
            </p>
            <div className="p-4 bg-muted rounded-lg mt-4">
              <p className="text-sm font-medium">Need help?</p>
              <p className="text-sm text-muted-foreground mt-1">
                If you experienced any issues during checkout, please contact our support team.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate({ to: '/plans' })}>
              View Plans Again
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: '/' })}
            >
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
