import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Crown, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Plan } from "../backend";
import type { ShoppingItem } from "../backend";
import {
  useCreateCheckoutSession,
  useGetCurrentPlan,
} from "../hooks/useQueries";

const planDetails = {
  free: {
    name: "Free Plan",
    price: "$0",
    period: "",
    description: "Access to arcade-style racing",
    features: [
      "Arcade-style racing",
      "Basic car models",
      "Limited tracks",
      "Practice mode",
    ],
    icon: Zap,
    color: "text-muted-foreground",
  },
  monthly: {
    name: "Monthly Premium",
    price: "$5",
    period: "/month",
    description: "Full access to all premium features",
    features: [
      "All Free features",
      "Realistic F1 racing",
      "Online multiplayer",
      "Group racing & tournaments",
      "Global leaderboards",
      "Enhanced graphics & physics",
      "Dynamic weather system",
      "Exclusive car designs",
    ],
    icon: Crown,
    color: "text-primary",
  },
  yearly: {
    name: "Yearly Premium",
    price: "$55",
    period: "/year",
    description: "Best value - Save $5 per year",
    features: [
      "All Monthly Premium features",
      "Save $5 compared to monthly",
      "Priority matchmaking",
      "Exclusive seasonal rewards",
      "Early access to new features",
    ],
    icon: Crown,
    color: "text-primary",
  },
};

export default function Plans() {
  const { data: currentPlan, isLoading: planLoading } = useGetCurrentPlan();
  const createCheckoutSession = useCreateCheckoutSession();
  const [processingPlan, setProcessingPlan] = useState<Plan | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (plan === Plan.free) return;

    setProcessingPlan(plan);
    try {
      const priceInCents = plan === Plan.monthly ? 500n : 5500n;
      const planName =
        plan === Plan.monthly ? "Monthly Premium" : "Yearly Premium";

      const items: ShoppingItem[] = [
        {
          productName: planName,
          productDescription: planDetails[plan].description,
          priceInCents,
          currency: "USD",
          quantity: 1n,
        },
      ];

      const session = await createCheckoutSession.mutateAsync(items);

      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }

      window.location.href = session.url;
    } catch (error: any) {
      toast.error(`Failed to start checkout: ${error.message}`);
      setProcessingPlan(null);
    }
  };

  if (planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Full Throttle Subscription Plans
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your racing experience. Upgrade to Premium
          for the ultimate F1 racing adventure.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {(Object.keys(planDetails) as Array<keyof typeof planDetails>).map(
          (planKey) => {
            const plan = planDetails[planKey];
            const planEnum = Plan[planKey];
            const isCurrentPlan = currentPlan === planEnum;
            const isProcessing = processingPlan === planEnum;
            const Icon = plan.icon;

            return (
              <Card
                key={planKey}
                className={`relative transition-all hover:shadow-lg ${
                  isCurrentPlan ? "border-primary border-2" : ""
                } ${planKey !== "free" ? "hover:scale-105" : ""}`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Current Plan
                  </Badge>
                )}
                {planKey === "yearly" && !isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                    Best Value
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                    <Icon className={`h-8 w-8 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    size="lg"
                    variant={
                      isCurrentPlan
                        ? "outline"
                        : planKey === "free"
                          ? "secondary"
                          : "default"
                    }
                    disabled={
                      isCurrentPlan || isProcessing || planKey === "free"
                    }
                    onClick={() => handleSubscribe(planEnum)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : planKey === "free" ? (
                      "Free Forever"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All premium plans include a secure checkout powered by Stripe.</p>
        <p className="mt-2">Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
}
