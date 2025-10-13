import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Webhook,
  Zap,
  Code,
  Database,
  Globe,
  Copy,
  CheckCircle2,
  ExternalLink,
  Send,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

export const IntegrationsGuide = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    event: "patient.registered",
    patient_id: "123",
    timestamp: new Date().toISOString()
  }, null, 2));
  const [copied, setCopied] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: testPayload,
      });

      toast.success("Webhook test sent! Check your endpoint to confirm receipt.");
    } catch (error) {
      console.error("Webhook test error:", error);
      toast.error("Failed to send webhook test");
    } finally {
      setIsTesting(false);
    }
  };

  const integrations = [
    {
      name: "Zapier",
      description: "Connect to 5,000+ apps with automated workflows",
      icon: Zap,
      color: "from-orange-500 to-orange-600",
      setup: [
        "Create a new Zap in Zapier",
        "Choose 'Webhooks by Zapier' as trigger",
        "Select 'Catch Hook' option",
        "Copy the webhook URL provided",
        "Paste the URL in the field below",
        "Test the connection"
      ]
    },
    {
      name: "REST API",
      description: "Direct API integration for custom applications",
      icon: Code,
      color: "from-blue-500 to-cyan-600",
      setup: [
        "Get your API endpoint from project settings",
        "Generate an API key for authentication",
        "Use standard HTTP methods (GET, POST, PUT, DELETE)",
        "Include Authorization header in requests",
        "Handle responses and error codes"
      ]
    },
    {
      name: "Database Webhooks",
      description: "Real-time database change notifications",
      icon: Database,
      color: "from-green-500 to-emerald-600",
      setup: [
        "Configure webhook URL in database settings",
        "Select which tables to monitor",
        "Choose events (insert, update, delete)",
        "Add filters for specific conditions",
        "Test webhook delivery"
      ]
    },
    {
      name: "Third-Party Systems",
      description: "Integration with external healthcare systems",
      icon: Globe,
      color: "from-purple-500 to-pink-600",
      setup: [
        "Review API documentation of target system",
        "Configure authentication credentials",
        "Map data fields between systems",
        "Set up data transformation rules",
        "Enable bi-directional sync if needed"
      ]
    },
  ];

  const apiEndpoints = [
    {
      method: "GET",
      endpoint: "/api/patients",
      description: "List all patients",
      params: "?limit=10&offset=0"
    },
    {
      method: "POST",
      endpoint: "/api/patients",
      description: "Create new patient",
      params: ""
    },
    {
      method: "GET",
      endpoint: "/api/appointments",
      description: "Get appointments",
      params: "?date=2025-10-13"
    },
    {
      method: "POST",
      endpoint: "/api/invoices",
      description: "Create invoice",
      params: ""
    },
    {
      method: "GET",
      endpoint: "/api/orders",
      description: "List orders",
      params: "?status=pending"
    },
  ];

  const webhookEvents = [
    { event: "patient.created", description: "New patient registered" },
    { event: "patient.updated", description: "Patient information updated" },
    { event: "appointment.booked", description: "New appointment scheduled" },
    { event: "appointment.cancelled", description: "Appointment cancelled" },
    { event: "invoice.created", description: "New invoice generated" },
    { event: "invoice.paid", description: "Invoice payment received" },
    { event: "order.created", description: "New order placed" },
    { event: "order.completed", description: "Order completed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6 text-primary" />
            System Integrations
          </CardTitle>
          <CardDescription className="text-base">
            Connect with external systems, automate workflows, and extend functionality
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">REST API</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-4">
            {integrations.map((integration, index) => (
              <Card
                key={integration.name}
                className="border-2 hover:shadow-lg transition-all group cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${integration.color} w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <integration.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-semibold text-sm">Quick Setup:</div>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      {integration.setup.slice(0, 3).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6 animate-fade-in">
          {/* Webhook Tester */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                Webhook Tester
              </CardTitle>
              <CardDescription>Test your webhook endpoint with custom payloads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Button onClick={handleTestWebhook} disabled={isTesting}>
                    {isTesting ? (
                      <>Testing...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Test
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Test Payload (JSON)</Label>
                <Textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="font-mono text-xs h-40"
                />
              </div>
            </CardContent>
          </Card>

          {/* Webhook Events */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Available Webhook Events</CardTitle>
              <CardDescription>Events that can trigger webhooks in your system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {webhookEvents.map((webhook) => (
                  <div
                    key={webhook.event}
                    className="p-4 border-2 rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-sm font-semibold text-primary mb-1">
                          {webhook.event}
                        </div>
                        <div className="text-sm text-muted-foreground">{webhook.description}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(webhook.event, webhook.event)}
                      >
                        {copied === webhook.event ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REST API */}
        <TabsContent value="api" className="space-y-6 animate-fade-in">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Available REST API endpoints for integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiEndpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="p-4 border-2 rounded-lg hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <Badge
                        className={
                          endpoint.method === "GET"
                            ? "bg-blue-500"
                            : endpoint.method === "POST"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }
                      >
                        {endpoint.method}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold mb-1">
                          {endpoint.endpoint}
                          {endpoint.params && (
                            <span className="text-muted-foreground">{endpoint.params}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{endpoint.description}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(`${endpoint.method} ${endpoint.endpoint}${endpoint.params}`, endpoint.endpoint)}
                      >
                        {copied === endpoint.endpoint ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-yellow-600" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-background rounded-lg border">
                <div className="text-sm font-semibold mb-2">API Key Authentication</div>
                <code className="text-xs bg-muted p-2 rounded block font-mono">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
              <div className="text-sm text-muted-foreground">
                API keys can be generated in Settings → API Keys. Keep your keys secure and never share them publicly.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples" className="space-y-6 animate-fade-in">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Integration Examples</CardTitle>
              <CardDescription>Code examples for common integration scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Example 1: Fetch Patients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Fetch Patients List</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(
                      `fetch('https://your-api.com/api/patients', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
}).then(res => res.json())`,
                      "patients-example"
                    )}
                  >
                    {copied === "patients-example" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{`fetch('https://your-api.com/api/patients', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
}).then(res => res.json())`}</code>
                </pre>
              </div>

              {/* Example 2: Create Appointment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Create Appointment</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(
                      `fetch('https://your-api.com/api/appointments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    patient_id: '123',
    date: '2025-10-15',
    time: '10:00',
    provider_id: '456'
  })
})`,
                      "appointment-example"
                    )}
                  >
                    {copied === "appointment-example" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{`fetch('https://your-api.com/api/appointments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    patient_id: '123',
    date: '2025-10-15',
    time: '10:00',
    provider_id: '456'
  })
})`}</code>
                </pre>
              </div>

              {/* Example 3: Webhook Handler */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Webhook Handler (Node.js)</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(
                      `app.post('/webhook', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'patient.created':
      console.log('New patient:', event.data);
      break;
    case 'invoice.paid':
      console.log('Invoice paid:', event.data);
      break;
  }
  
  res.status(200).send('OK');
});`,
                      "webhook-example"
                    )}
                  >
                    {copied === "webhook-example" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{`app.post('/webhook', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'patient.created':
      console.log('New patient:', event.data);
      break;
    case 'invoice.paid':
      console.log('Invoice paid:', event.data);
      break;
  }
  
  res.status(200).send('OK');
});`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card className="border-2 border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                Additional Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="https://zapier.com" target="_blank" rel="noopener noreferrer">
                    <span>Zapier Documentation</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <span>API Reference Guide</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <span>Integration Best Practices</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
