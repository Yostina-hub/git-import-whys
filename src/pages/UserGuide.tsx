import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Play,
  Sparkles,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  Video,
  MessageSquare,
  ChevronRight,
  Lightbulb,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AIGuideAssistant } from "@/components/guide/AIGuideAssistant";
import { InteractiveTutorial } from "@/components/guide/InteractiveTutorial";
import { QuickStartGuide } from "@/components/guide/QuickStartGuide";
import { VideoTutorials } from "@/components/guide/VideoTutorials";

const UserGuide = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const modules = [
    {
      id: "patients",
      title: "Patient Management",
      description: "Register, search, and manage patient records",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      features: ["Registration", "Search & Filter", "Medical Records", "Demographics"],
      path: "/patients",
    },
    {
      id: "appointments",
      title: "Appointments",
      description: "Schedule and manage patient appointments",
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
      features: ["Booking", "Calendar View", "Reminders", "Rescheduling"],
      path: "/appointments",
    },
    {
      id: "clinical",
      title: "Clinical Records",
      description: "EMR, assessments, and clinical documentation",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      features: ["EMR Notes", "Vitals", "Medications", "Allergies"],
      path: "/clinical",
    },
    {
      id: "billing",
      title: "Billing & Invoicing",
      description: "Generate invoices and process payments",
      icon: DollarSign,
      color: "from-yellow-500 to-orange-500",
      features: ["Invoices", "Payments", "Refunds", "Reports"],
      path: "/billing",
    },
    {
      id: "consultation",
      title: "Online Consultation",
      description: "Video calls and telemedicine features",
      icon: Video,
      color: "from-indigo-500 to-purple-500",
      features: ["Video Calls", "Chat", "E-Prescriptions", "Screen Share"],
      path: "/online-consultation",
    },
    {
      id: "queue",
      title: "Queue Management",
      description: "Manage patient queues and workflow",
      icon: TrendingUp,
      color: "from-red-500 to-pink-500",
      features: ["Triage", "Doctor Queue", "Status Tracking", "Analytics"],
      path: "/queue-management",
    },
  ];

  const quickTips = [
    {
      title: "Keyboard Shortcuts",
      description: "Use Ctrl+K to quick search patients",
      icon: Zap,
      color: "text-yellow-500",
    },
    {
      title: "Smart Filters",
      description: "Click on any stat card to auto-filter results",
      icon: Lightbulb,
      color: "text-blue-500",
    },
    {
      title: "Bulk Actions",
      description: "Select multiple items for batch operations",
      icon: Award,
      color: "text-purple-500",
    },
    {
      title: "Auto-Save",
      description: "All forms auto-save as you type",
      icon: Shield,
      color: "text-green-500",
    },
  ];

  const filteredModules = modules.filter(
    (module) =>
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-12 px-6">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Intelligent User Guide
              </h1>
              <p className="text-muted-foreground mt-1">
                Master the EMR system with AI-powered assistance
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mt-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search guides, features, or ask a question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-6 text-lg border-2 focus:border-primary transition-all"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:scale-105">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Features</div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:scale-105">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Tutorials</div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:scale-105">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">AI Support</div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:scale-105">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Possibilities</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="quickstart" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-2">
              <Play className="h-4 w-4" />
              Tutorials
            </TabsTrigger>
            <TabsTrigger value="interactive" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Interactive
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Quick Tips */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Quick Tips & Shortcuts
                </CardTitle>
                <CardDescription>Boost your productivity with these power features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {quickTips.map((tip, index) => (
                    <div
                      key={index}
                      className="p-4 bg-background/50 rounded-lg border hover:border-primary/50 transition-all hover:scale-105 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <tip.icon className={`h-5 w-5 ${tip.color} mt-1`} />
                        <div>
                          <div className="font-semibold">{tip.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">{tip.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Modules Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((module, index) => (
                <Card
                  key={module.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(module.path)}
                >
                  <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform`}>
                        <module.icon className="h-6 w-6 text-white" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="mt-4">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="animate-fade-in">
            <QuickStartGuide />
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="animate-fade-in">
            <VideoTutorials />
          </TabsContent>

          {/* Interactive Tutorial Tab */}
          <TabsContent value="interactive" className="animate-fade-in">
            <InteractiveTutorial />
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="animate-fade-in">
            <AIGuideAssistant />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserGuide;
