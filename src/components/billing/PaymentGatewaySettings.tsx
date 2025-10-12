import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Building2, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock payment gateway configurations
const mockGatewayConfigs = {
  telebirr: {
    enabled: true,
    merchant_id: "DEMO_MERCHANT_001",
    app_id: "demo_app_telebirr",
    public_key: "mock_public_key_telebirr",
    environment: "sandbox",
  },
  cbe: {
    enabled: true,
    merchant_code: "CBE_DEMO_123",
    terminal_id: "TERM_001",
    api_key: "mock_cbe_api_key",
    environment: "sandbox",
  },
};

export const PaymentGatewaySettings = () => {
  const { toast } = useToast();
  const [telebirrConfig, setTelebirrConfig] = useState(mockGatewayConfigs.telebirr);
  const [cbeConfig, setCbeConfig] = useState(mockGatewayConfigs.cbe);

  const handleSave = () => {
    toast({
      title: "Settings Saved (Mock)",
      description: "Payment gateway configurations updated. Using mock data for now.",
    });
  };

  return (
    <div className="space-y-6">
      {/* TeleBirr Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <CardTitle>TeleBirr Payment Gateway</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={telebirrConfig.enabled ? "default" : "secondary"}>
                {telebirrConfig.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Badge variant="outline">{telebirrConfig.environment}</Badge>
            </div>
          </div>
          <CardDescription>
            Configure TeleBirr mobile payment integration for Ethiopian customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="telebirr-enabled">Enable TeleBirr Payments</Label>
            <Switch
              id="telebirr-enabled"
              checked={telebirrConfig.enabled}
              onCheckedChange={(checked) => 
                setTelebirrConfig({ ...telebirrConfig, enabled: checked })
              }
            />
          </div>

          <div>
            <Label htmlFor="telebirr-env">Environment</Label>
            <Select
              value={telebirrConfig.environment}
              onValueChange={(value) => 
                setTelebirrConfig({ ...telebirrConfig, environment: value })
              }
            >
              <SelectTrigger id="telebirr-env">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="production">Production (Live)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="telebirr-merchant">Merchant ID</Label>
            <Input
              id="telebirr-merchant"
              value={telebirrConfig.merchant_id}
              onChange={(e) => 
                setTelebirrConfig({ ...telebirrConfig, merchant_id: e.target.value })
              }
              placeholder="Enter TeleBirr Merchant ID"
            />
          </div>

          <div>
            <Label htmlFor="telebirr-app">App ID</Label>
            <Input
              id="telebirr-app"
              value={telebirrConfig.app_id}
              onChange={(e) => 
                setTelebirrConfig({ ...telebirrConfig, app_id: e.target.value })
              }
              placeholder="Enter TeleBirr App ID"
            />
          </div>

          <div>
            <Label htmlFor="telebirr-key">Public Key</Label>
            <Input
              id="telebirr-key"
              type="password"
              value={telebirrConfig.public_key}
              onChange={(e) => 
                setTelebirrConfig({ ...telebirrConfig, public_key: e.target.value })
              }
              placeholder="Enter TeleBirr Public Key"
            />
          </div>
        </CardContent>
      </Card>

      {/* CBE Birr Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>CBE Birr Payment Gateway</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={cbeConfig.enabled ? "default" : "secondary"}>
                {cbeConfig.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Badge variant="outline">{cbeConfig.environment}</Badge>
            </div>
          </div>
          <CardDescription>
            Configure Commercial Bank of Ethiopia payment integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cbe-enabled">Enable CBE Birr Payments</Label>
            <Switch
              id="cbe-enabled"
              checked={cbeConfig.enabled}
              onCheckedChange={(checked) => 
                setCbeConfig({ ...cbeConfig, enabled: checked })
              }
            />
          </div>

          <div>
            <Label htmlFor="cbe-env">Environment</Label>
            <Select
              value={cbeConfig.environment}
              onValueChange={(value) => 
                setCbeConfig({ ...cbeConfig, environment: value })
              }
            >
              <SelectTrigger id="cbe-env">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="production">Production (Live)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cbe-merchant">Merchant Code</Label>
            <Input
              id="cbe-merchant"
              value={cbeConfig.merchant_code}
              onChange={(e) => 
                setCbeConfig({ ...cbeConfig, merchant_code: e.target.value })
              }
              placeholder="Enter CBE Merchant Code"
            />
          </div>

          <div>
            <Label htmlFor="cbe-terminal">Terminal ID</Label>
            <Input
              id="cbe-terminal"
              value={cbeConfig.terminal_id}
              onChange={(e) => 
                setCbeConfig({ ...cbeConfig, terminal_id: e.target.value })
              }
              placeholder="Enter Terminal ID"
            />
          </div>

          <div>
            <Label htmlFor="cbe-key">API Key</Label>
            <Input
              id="cbe-key"
              type="password"
              value={cbeConfig.api_key}
              onChange={(e) => 
                setCbeConfig({ ...cbeConfig, api_key: e.target.value })
              }
              placeholder="Enter CBE API Key"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Gateway Settings
        </Button>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Currently using <strong>mock data</strong> for development. Payment gateway integrations 
            are prepared and ready for production credentials when available. Both TeleBirr and CBE Birr 
            will be fully functional once live API credentials are configured.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
