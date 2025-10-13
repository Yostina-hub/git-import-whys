import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Check, X, Loader2 } from "lucide-react";
import { z } from "zod";

interface CouponCodeInputProps {
  subtotal: number;
  onCouponApplied: (discount: { code: string; type: string; value: number; amount: number }) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: { code: string; type: string; value: number; amount: number } | null;
}

const couponCodeSchema = z.string()
  .trim()
  .min(1, "Coupon code cannot be empty")
  .max(50, "Coupon code too long")
  .regex(/^[A-Z0-9-_]+$/i, "Invalid coupon code format");

export const CouponCodeInput = ({ 
  subtotal, 
  onCouponApplied, 
  onCouponRemoved,
  appliedCoupon 
}: CouponCodeInputProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const validateAndApplyCoupon = async () => {
    try {
      // Validate input format
      const validatedCode = couponCodeSchema.parse(couponCode);
      
      setValidating(true);

      // Fetch coupon from database
      const { data: coupon, error } = await supabase
        .from("discount_policies")
        .select("*")
        .eq("code", validatedCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          variant: "destructive",
          title: "Invalid coupon",
          description: "This coupon code does not exist or is no longer active",
        });
        setValidating(false);
        return;
      }

      // Check if coupon is still valid (date range)
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null;

      if (now < validFrom) {
        toast({
          variant: "destructive",
          title: "Coupon not yet valid",
          description: `This coupon will be active from ${validFrom.toLocaleDateString()}`,
        });
        setValidating(false);
        return;
      }

      if (validTo && now > validTo) {
        toast({
          variant: "destructive",
          title: "Coupon expired",
          description: `This coupon expired on ${validTo.toLocaleDateString()}`,
        });
        setValidating(false);
        return;
      }

      // Check minimum purchase amount
      if (coupon.min_purchase_amount && subtotal < Number(coupon.min_purchase_amount)) {
        toast({
          variant: "destructive",
          title: "Minimum purchase not met",
          description: `Minimum purchase of $${Number(coupon.min_purchase_amount).toFixed(2)} required`,
        });
        setValidating(false);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit) {
        const { count } = await supabase
          .from("coupon_usage")
          .select("*", { count: 'exact', head: true })
          .eq("coupon_code", validatedCode.toUpperCase());

        if (count && count >= coupon.usage_limit) {
          toast({
            variant: "destructive",
            title: "Coupon limit reached",
            description: "This coupon has reached its usage limit",
          });
          setValidating(false);
          return;
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
        
        // Apply max discount cap if exists
        if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
          discountAmount = Number(coupon.max_discount_amount);
        }
      } else if (coupon.discount_type === "fixed") {
        discountAmount = Number(coupon.discount_value);
        
        // Discount cannot exceed subtotal
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }

      onCouponApplied({
        code: validatedCode.toUpperCase(),
        type: coupon.discount_type,
        value: Number(coupon.discount_value),
        amount: discountAmount,
      });

      toast({
        title: "Coupon applied!",
        description: `You saved $${discountAmount.toFixed(2)}`,
      });

      setCouponCode("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid coupon code",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to validate coupon code",
        });
      }
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    toast({
      title: "Coupon removed",
      description: "Discount has been removed from invoice",
    });
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-primary" />
        Coupon Code
      </Label>
      
      {appliedCoupon ? (
        <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/20 rounded-lg">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-semibold text-success">Coupon Applied</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-success/10 text-success border-success">
                  {appliedCoupon.code}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {appliedCoupon.type === "percentage" 
                    ? `${appliedCoupon.value}% off` 
                    : `$${appliedCoupon.value} off`
                  }
                </span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), validateAndApplyCoupon())}
            className="font-mono uppercase"
            maxLength={50}
            disabled={validating}
          />
          <Button
            type="button"
            variant="outline"
            onClick={validateAndApplyCoupon}
            disabled={!couponCode || validating}
            className="gap-2"
          >
            {validating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ticket className="h-4 w-4" />
            )}
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};