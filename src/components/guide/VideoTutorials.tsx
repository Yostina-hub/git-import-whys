import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Play, Clock, Users, TrendingUp, Search } from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  views: string;
  thumbnail: string;
}

export const VideoTutorials = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const tutorials: Tutorial[] = [
    {
      id: "1",
      title: "Complete Patient Registration Walkthrough",
      description: "Step-by-step guide to registering new patients with all required information",
      duration: "8:45",
      level: "Beginner",
      category: "Patient Management",
      views: "12.5K",
      thumbnail: "from-blue-500 to-cyan-500",
    },
    {
      id: "2",
      title: "Appointment Scheduling Best Practices",
      description: "Learn efficient appointment booking, calendar management, and reminders",
      duration: "6:30",
      level: "Beginner",
      category: "Appointments",
      views: "9.8K",
      thumbnail: "from-purple-500 to-pink-500",
    },
    {
      id: "3",
      title: "Clinical Documentation Masterclass",
      description: "Master EMR notes, SOAP documentation, and clinical workflows",
      duration: "15:20",
      level: "Intermediate",
      category: "Clinical Records",
      views: "15.2K",
      thumbnail: "from-green-500 to-emerald-500",
    },
    {
      id: "4",
      title: "Billing & Invoice Management",
      description: "Create invoices, process payments, and handle refunds efficiently",
      duration: "10:15",
      level: "Beginner",
      category: "Billing",
      views: "11.3K",
      thumbnail: "from-yellow-500 to-orange-500",
    },
    {
      id: "5",
      title: "Queue Management & Triage",
      description: "Optimize patient flow with triage protocols and queue management",
      duration: "12:40",
      level: "Intermediate",
      category: "Queue Management",
      views: "8.7K",
      thumbnail: "from-red-500 to-pink-500",
    },
    {
      id: "6",
      title: "Online Consultation Setup",
      description: "Configure and conduct video consultations with patients",
      duration: "14:55",
      level: "Advanced",
      category: "Telemedicine",
      views: "6.9K",
      thumbnail: "from-indigo-500 to-purple-500",
    },
    {
      id: "7",
      title: "Advanced Reporting & Analytics",
      description: "Generate insights from clinical and financial data",
      duration: "18:30",
      level: "Advanced",
      category: "Reports",
      views: "5.4K",
      thumbnail: "from-pink-500 to-rose-500",
    },
    {
      id: "8",
      title: "User Role & Permission Management",
      description: "Configure user roles, permissions, and clinic access",
      duration: "9:20",
      level: "Advanced",
      category: "Administration",
      views: "4.2K",
      thumbnail: "from-slate-500 to-gray-500",
    },
  ];

  const filteredTutorials = tutorials.filter(
    (tutorial) =>
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Intermediate":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Advanced":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredTutorials.map((tutorial, index) => (
          <Card
            key={tutorial.id}
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Thumbnail */}
            <div className={`h-48 bg-gradient-to-br ${tutorial.thumbnail} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="p-6 bg-white/20 backdrop-blur-sm rounded-full group-hover:scale-110 transition-transform">
                  <Play className="h-12 w-12 text-white fill-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold">
                {tutorial.duration}
              </div>
              <div className="absolute top-2 left-2">
                <Badge className={getLevelColor(tutorial.level)}>{tutorial.level}</Badge>
              </div>
            </div>

            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {tutorial.title}
                </CardTitle>
              </div>
              <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{tutorial.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{tutorial.views}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {tutorial.category}
                </Badge>
              </div>

              <Button className="w-full mt-4 group-hover:bg-primary/90" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Watch Tutorial
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No tutorials found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
