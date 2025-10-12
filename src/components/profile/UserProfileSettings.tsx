import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Briefcase, FileText } from "lucide-react";

interface ProfileData {
  first_name: string;
  last_name: string;
  phone_mobile: string | null;
  job_title: string | null;
  department: string | null;
  specialty: string | null;
}

export const UserProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone_mobile: null,
    job_title: null,
    department: null,
    specialty: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          phone_mobile: data.phone_mobile,
          job_title: data.job_title,
          department: data.department,
          specialty: data.specialty,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {profile.first_name} {profile.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">
                <User className="inline h-4 w-4 mr-2" />
                First Name
              </Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) =>
                  setProfile({ ...profile, first_name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) =>
                  setProfile({ ...profile, last_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-2" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Email cannot be changed here
            </p>
          </div>

          <div>
            <Label htmlFor="phone_mobile">
              <Phone className="inline h-4 w-4 mr-2" />
              Mobile Phone
            </Label>
            <Input
              id="phone_mobile"
              type="tel"
              value={profile.phone_mobile || ""}
              onChange={(e) =>
                setProfile({ ...profile, phone_mobile: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job_title">
                <Briefcase className="inline h-4 w-4 mr-2" />
                Job Title
              </Label>
              <Input
                id="job_title"
                value={profile.job_title || ""}
                onChange={(e) =>
                  setProfile({ ...profile, job_title: e.target.value })
                }
                placeholder="e.g., Physician"
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={profile.department || ""}
                onChange={(e) =>
                  setProfile({ ...profile, department: e.target.value })
                }
                placeholder="e.g., Cardiology"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specialty">
              <FileText className="inline h-4 w-4 mr-2" />
              Specialty
            </Label>
            <Input
              id="specialty"
              value={profile.specialty || ""}
              onChange={(e) =>
                setProfile({ ...profile, specialty: e.target.value })
              }
              placeholder="e.g., Internal Medicine"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
