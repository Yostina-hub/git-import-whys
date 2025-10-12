import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Bell, UserCircle, Sparkles, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIClinicalAssistant } from "./AIClinicalAssistant";
import { AIVoiceAssistant } from "./AIVoiceAssistant";

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
  onProfileClick: () => void;
  title?: string;
  subtitle?: string;
}

export function DashboardHeader({ 
  user, 
  onLogout, 
  onProfileClick,
  title = "Dashboard",
  subtitle = "Manage your clinic with cutting-edge technology" 
}: DashboardHeaderProps) {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);

  const getInitials = (email: string | undefined) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" className="gap-2" onClick={() => setAiAssistantOpen(true)}>
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
                >
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-popover">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New appointment booked</p>
                  <p className="text-xs text-muted-foreground">Sarah Johnson - 10 minutes ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Patient checked in</p>
                  <p className="text-xs text-muted-foreground">Michael Brown - 25 minutes ago</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Voice Assistant Floating Button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 z-50"
        onClick={() => setVoiceAssistantOpen(true)}
      >
        <Mic className="h-5 w-5" />
      </Button>

      {/* AI Dialogs */}
      <AIClinicalAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} />
      <AIVoiceAssistant open={voiceAssistantOpen} onOpenChange={setVoiceAssistantOpen} />
    </div>
  );
}
