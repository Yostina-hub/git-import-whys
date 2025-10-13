import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Calendar, Users, Sparkles, ArrowRight, Activity, Shield, Clock, Star, Zap, Brain, Stethoscope, Pill, TestTube } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicAppointmentBooking } from "@/components/appointments/PublicAppointmentBooking";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Badge } from "@/components/ui/badge";

const PublicPortal = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Diagnostics",
      description: "Advanced artificial intelligence assists our doctors in providing accurate diagnoses faster than ever",
      color: "from-purple-500 to-pink-600",
      glow: "shadow-purple-500/50"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Book appointments instantly with real-time availability and intelligent doctor matching",
      color: "from-blue-500 to-cyan-600",
      glow: "shadow-blue-500/50"
    },
    {
      icon: Activity,
      title: "24/7 Health Monitoring",
      description: "Continuous health tracking and instant alerts for any concerning changes",
      color: "from-green-500 to-emerald-600",
      glow: "shadow-green-500/50"
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "Your health data is protected with the highest level of encryption and privacy",
      color: "from-orange-500 to-red-600",
      glow: "shadow-orange-500/50"
    }
  ];

  const services = [
    { icon: Stethoscope, name: "General Medicine", count: "50+ Doctors" },
    { icon: Heart, name: "Cardiology", count: "20+ Specialists" },
    { icon: Brain, name: "Neurology", count: "15+ Experts" },
    { icon: Pill, name: "Pharmacy", count: "24/7 Available" },
    { icon: TestTube, name: "Laboratory", count: "Advanced Testing" },
    { icon: Activity, name: "Emergency Care", count: "Instant Response" }
  ];

  const stats = [
    { value: "100K+", label: "Patients Treated", icon: Users },
    { value: "500+", label: "Medical Experts", icon: Stethoscope },
    { value: "50+", label: "Specialties", icon: Sparkles },
    { value: "24/7", label: "Emergency Care", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
      {/* Floating particles animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Futuristic Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Zemar
                </h1>
                <p className="text-xs text-muted-foreground">The Future of Medical Care</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a 
                href="#features" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Features
              </a>
              <a 
                href="#services" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Services
              </a>
              <a 
                href="#booking" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Book Appointment
              </a>
              <a 
                href="#testimonials" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Testimonials
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth")}
                className="hover:bg-primary/10"
              >
                Staff Portal
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/50"
              >
                <Zap className="h-4 w-4 mr-2" />
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section - Beyond Imagination */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-8 mb-16">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-6 py-2 text-sm">
                  <Sparkles className="h-4 w-4 mr-2 inline" />
                  Welcome to the Future of Healthcare
                </Badge>
                
                <h2 className="text-6xl md:text-7xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                    Your Health,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Reimagined
                  </span>
                </h2>
                
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Experience healthcare powered by cutting-edge AI, delivered with human compassion. 
                  Where technology meets care, and innovation serves life.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/50 text-lg px-8 py-6"
                    onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Appointment
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 text-lg px-8 py-6 hover:bg-primary/5"
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    Explore Services
                  </Button>
                </div>
              </div>

              {/* Animated Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <Card 
                    key={idx}
                    className="border-2 hover:shadow-2xl transition-all duration-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:scale-105 group"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50 mb-4 group-hover:scale-110 transition-transform">
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Features Showcase */}
        <section id="features" className="py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Revolutionary Features
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Cutting-edge technology that transforms the healthcare experience
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {features.map((feature, idx) => (
                  <Card
                    key={idx}
                    className={`border-2 hover:shadow-2xl transition-all duration-500 cursor-pointer group ${
                      activeFeature === idx ? 'ring-2 ring-purple-500 scale-105' : ''
                    }`}
                    onClick={() => setActiveFeature(idx)}
                    onMouseEnter={() => setActiveFeature(idx)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} shadow-xl ${feature.glow} group-hover:scale-110 transition-transform`}>
                          <feature.icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors">
                            {feature.title}
                          </h4>
                          <p className="text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section id="services" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Comprehensive Medical Services
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Expert care across all medical specialties
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
              {services.map((service, idx) => (
                <Card 
                  key={idx}
                  className="border-2 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-900"
                >
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50 mb-4 group-hover:scale-110 transition-transform">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                      {service.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {service.count}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section id="booking" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-6 py-2 text-sm mb-4">
                <Star className="h-4 w-4 mr-2 inline" />
                Easy & Fast Booking
              </Badge>
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Health Journey Starts Here
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Book your appointment in seconds with our intelligent scheduling system
              </p>
            </div>

            <PublicAppointmentBooking />
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Trusted by Thousands
              </h3>
              <p className="text-lg text-muted-foreground">
                Real stories from real patients
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { name: "Sarah Johnson", rating: 5, text: "The AI-powered diagnostics helped detect my condition early. Truly life-changing!" },
                { name: "Michael Chen", rating: 5, text: "24/7 health monitoring gives me peace of mind. Best medical experience ever!" },
                { name: "Emma Davis", rating: 5, text: "Booking appointments is so easy now. The future of healthcare is here!" }
              ].map((testimonial, idx) => (
                <Card key={idx} className="border-2 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50 dark:from-slate-900 dark:to-purple-900">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                    <p className="font-semibold text-sm">- {testimonial.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default PublicPortal;