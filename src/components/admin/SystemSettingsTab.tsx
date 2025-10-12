import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  category: string;
  description: string | null;
}

export const SystemSettingsTab = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("system_settings" as any)
      .select("*")
      .order("category", { ascending: true });

    if (!error && data) {
      setSettings(data as any);
    }
    setLoading(false);
  };

  const handleSave = async (setting: Setting, newValue: any) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("system_settings" as any)
      .update({
        setting_value: newValue,
        updated_by: user?.id,
      })
      .eq("id", setting.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving setting",
        description: error.message,
      });
    } else {
      toast({
        title: "Setting saved",
        description: "System setting has been updated",
      });
      loadSettings();
    }
    setSaving(false);
  };

  const renderInput = (setting: Setting) => {
    const value = typeof setting.setting_value === 'string' 
      ? JSON.parse(setting.setting_value)
      : setting.setting_value;

    switch (setting.setting_type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={setting.setting_key}>{setting.description}</Label>
            <Switch
              id={setting.setting_key}
              checked={value}
              onCheckedChange={(checked) => handleSave(setting, checked)}
              disabled={saving}
            />
          </div>
        );
      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.setting_key}>{setting.description}</Label>
            <div className="flex gap-2">
              <Input
                id={setting.setting_key}
                type="number"
                defaultValue={value}
                onBlur={(e) => handleSave(setting, Number(e.target.value))}
                disabled={saving}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.setting_key}>{setting.description}</Label>
            <div className="flex gap-2">
              <Input
                id={setting.setting_key}
                type="text"
                defaultValue={value}
                onBlur={(e) => handleSave(setting, e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  const categories = [...new Set(settings.map((s) => s.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category} Settings</CardTitle>
            <CardDescription>
              Configure {category} related system settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings
              .filter((s) => s.category === category)
              .map((setting) => (
                <div key={setting.id}>{renderInput(setting)}</div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
