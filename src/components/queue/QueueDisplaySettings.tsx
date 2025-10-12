import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Monitor, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const QueueDisplaySettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    showWaitingCount: true,
    playSound: true,
    fontSize: "large",
  });

  const displayUrl = `${window.location.origin}/queue-display`;

  const copyDisplayUrl = () => {
    navigator.clipboard.writeText(displayUrl);
    toast({
      title: "URL Copied",
      description: "Display URL copied to clipboard",
    });
  };

  const openDisplayWindow = () => {
    window.open(displayUrl, "_blank", "width=1920,height=1080,fullscreen=yes");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Display Configuration
          </CardTitle>
          <CardDescription>
            Configure settings for queue display screens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically update display
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={settings.autoRefresh}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoRefresh: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-waiting">Show Waiting Count</Label>
                <p className="text-sm text-muted-foreground">
                  Display number of waiting patients
                </p>
              </div>
              <Switch
                id="show-waiting"
                checked={settings.showWaitingCount}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showWaitingCount: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="play-sound">Play Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Audio notification when calling patients
                </p>
              </div>
              <Switch
                id="play-sound"
                checked={settings.playSound}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, playSound: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min="5"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) =>
                  setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display URL</CardTitle>
          <CardDescription>
            Open this URL on external displays or screens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={displayUrl} readOnly />
            <Button variant="outline" onClick={copyDisplayUrl}>
              Copy
            </Button>
          </div>
          <Button onClick={openDisplayWindow} className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Display in New Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
