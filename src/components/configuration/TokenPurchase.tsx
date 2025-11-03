import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins, CreditCard } from "lucide-react";
import { useAIAccess } from "@/hooks/useAIAccess";

const TOKEN_PACKAGES = [
  { tokens: 10000, price: 5, label: "Starter" },
  { tokens: 50000, price: 20, label: "Pro", savings: "20% off" },
  { tokens: 100000, price: 35, label: "Business", savings: "30% off" },
  { tokens: 500000, price: 150, label: "Enterprise", savings: "40% off" },
];

export const TokenPurchase = () => {
  const [customTokens, setCustomTokens] = useState(10000);
  const [loading, setLoading] = useState(false);
  const { accessStatus, checkAccess } = useAIAccess();
  const { toast } = useToast();

  const handlePurchase = async (tokens: number, amount: number) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // In a real implementation, this would integrate with Stripe
      // For now, we'll simulate the purchase
      const { error: purchaseError } = await supabase
        .from("ai_token_purchases" as any)
        .insert({
          user_id: user.id,
          tokens_purchased: tokens,
          amount_paid: amount,
          payment_status: "completed",
        });

      if (purchaseError) throw purchaseError;

      // Update user's token balance
      const { error: updateError } = await supabase.rpc("add_user_tokens" as any, {
        _user_id: user.id,
        _tokens: tokens,
      });

      if (updateError) {
        // If function doesn't exist, update directly
        const { data: currentAccess } = await supabase
          .from("user_ai_access" as any)
          .select("token_balance")
          .eq("user_id", user.id)
          .single();

        const newBalance = ((currentAccess as any)?.token_balance || 0) + tokens;
        
        await supabase
          .from("user_ai_access" as any)
          .update({ token_balance: newBalance })
          .eq("user_id", user.id);
      }

      toast({
        title: "Tokens purchased!",
        description: `${tokens.toLocaleString()} tokens added to your balance`,
      });

      checkAccess(); // Refresh access status
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        variant: "destructive",
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const customPrice = (customTokens / 1000) * 0.5;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Your Token Balance
          </CardTitle>
          <CardDescription>Current available tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {(accessStatus?.token_balance || 0).toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Daily limit: {(accessStatus?.daily_token_limit || 0).toLocaleString()} tokens
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token Packages</CardTitle>
          <CardDescription>Choose a package or customize your purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {TOKEN_PACKAGES.map((pkg) => (
              <Card key={pkg.tokens} className="relative overflow-hidden">
                {pkg.savings && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      {pkg.savings}
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.label}</CardTitle>
                  <CardDescription>
                    {pkg.tokens.toLocaleString()} tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <Button
                    onClick={() => handlePurchase(pkg.tokens, pkg.price)}
                    disabled={loading}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Custom Amount</CardTitle>
              <CardDescription>$0.50 per 1,000 tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Number of Tokens</Label>
                <Input
                  type="number"
                  value={customTokens}
                  onChange={(e) => setCustomTokens(parseInt(e.target.value) || 0)}
                  min={1000}
                  step={1000}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold">${customPrice.toFixed(2)}</span>
              </div>
              <Button
                onClick={() => handlePurchase(customTokens, customPrice)}
                disabled={loading || customTokens < 1000}
                className="w-full"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase {customTokens.toLocaleString()} Tokens
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Your recent token purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Purchase history will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
