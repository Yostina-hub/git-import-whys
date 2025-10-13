import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Calendar, Users, Sparkles, ArrowRight, Activity, Shield, Clock, Star, Zap, Brain, Stethoscope, Pill, TestTube, Target, LineChart, Microscope, Play } from "lucide-react";
import { PublicAppointmentBooking } from "@/components/appointments/PublicAppointmentBooking";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Badge } from "@/components/ui/badge";

const PublicPortal = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Zap,
      title: "Immediate Improvement",
      description: "Patients generally experience immediate relief and measurable improvements following the 15-minute treatment.",
    },
    {
      icon: Heart,
      title: "Deep Healing",
      description: "Creates a therapeutic environment that targets the root cause of chronic pain while simultaneously relieving symptoms.",
    },
    {
      icon: Microscope,
      title: "Scientifically Supported",
      description: "Over 2 million data points and numerous global studies support the clinical and cellular level effectiveness of this treatment.",
    },
    {
      icon: Sparkles,
      title: "Painless Experience",
      description: "Provides a calming, safe, and completely pain-free treatment experience.",
    },
  ];

  const services = [
    { icon: Stethoscope, name: "Pain Treatment", count: "Specialized Care" },
    { icon: Brain, name: "Neurology", count: "Expert Clinicians" },
    { icon: Activity, name: "Spinal Care", count: "Advanced Tech" },
    { icon: Heart, name: "Personalized", count: "Protocols" },
    { icon: TestTube, name: "Diagnostics", count: "3D Analysis" },
    { icon: Shield, name: "Safe & Proven", count: "FDA Approved" }
  ];

  const stats = [
    { value: "98%", label: "Patient Satisfaction", icon: Target },
    { value: "2M+", label: "Data Points Analyzed", icon: LineChart },
    { value: "15min", label: "Treatment Time", icon: Clock },
    { value: "100%", label: "Pain-Free Process", icon: Microscope }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Floating particles animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-50 animate-pulse" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-xl">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  Zemar
                </h1>
                <p className="text-xs text-muted-foreground">by Neuro Spinal Innovation</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a 
                href="#features" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Benefits
              </a>
              <a 
                href="#about" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                About Us
              </a>
              <a 
                href="#booking" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Book Demo
              </a>
              <a 
                href="#services" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Technology
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth")}
                className="hover:bg-primary/10"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Staff Portal
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/10">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ top: '20%', left: '5%' }} />
            <div className="absolute w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ bottom: '10%', right: '5%', animationDelay: '1.5s' }} />
            <div className="absolute w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ top: '50%', right: '20%', animationDelay: '3s' }} />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-block">
                  <span className="px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full text-primary font-semibold border border-primary/20 text-sm">
                    Powered by Neuro Spinal Innovation
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="text-foreground">Revolutionizing</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                    Pain Treatment
                  </span>
                </h1>
                
                <div className="space-y-4">
                  <p className="text-xl md:text-2xl font-semibold text-foreground">
                    Scientifically Supported Treatment for Your Pain
                  </p>
                  <p className="text-lg text-muted-foreground max-w-xl">
                    Designed with both clinicians and patients in mind. Non-invasive and integratable into existing healthcare settings.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-xl">
                    <Play className="mr-2 h-5 w-5" />
                    See How it Works
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                    Book a Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Right Content - Stats */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, idx) => (
                    <Card 
                      key={idx}
                      className={`p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all hover:scale-105 ${
                        idx === 1 || idx === 2 ? 'mt-8' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <stat.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-3xl font-bold text-primary">{stat.value}</h3>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-24 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Advanced Treatment Benefits
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the future of pain management with our scientifically-backed technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-8 text-center hover:shadow-xl transition-all hover:-translate-y-2 bg-card border-primary/20 group">
                  <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <benefit.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 px-4">
          <div className="container mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 text-sm mb-4">
                  About Us
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">
                  The <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ZEMAR</span> Treatment
                </h2>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border-2 border-primary/20 rounded-3xl p-8 md:p-12">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Neuro Spinal Innovation (NSI) is proud to introduce the ZEMAR device, a ground-breaking treatment for, among other things, back and neck pain. This non-invasive medical device delivers Accelerated Low-Frequency Kinetically Directed Impulses (ALKINDI pulses) directly to the region of the body that has been damaged or compromised.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  The delivery of the ALKINDI pulses through the ZEMAR device has been shown to positively influence gene expression. The era of deep healing has arrived. The ZEMAR Intelligence software and 3D diagnostics allow clinicians to build a personalized treatment protocol to address the root cause of pain and dysfunction.
                </p>
                <div className="flex justify-center pt-6">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Grid */}
        <section id="services" className="py-24 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Comprehensive Technology
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Advanced innovation across all treatment aspects
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
              {services.map((service, idx) => (
                <Card 
                  key={idx}
                  className="border-2 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-2 bg-card"
                >
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg mb-4 group-hover:scale-110 transition-transform">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
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
        <section id="booking" className="py-24 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 text-sm mb-4">
                <Star className="h-4 w-4 mr-2 inline" />
                Easy Scheduling
              </Badge>
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Experience the Future of Pain Treatment
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Book your demonstration or consultation in seconds
              </p>
            </div>

            <PublicAppointmentBooking />
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Trusted by Healthcare Professionals
              </h3>
              <p className="text-lg text-muted-foreground">
                Real results from real patients and clinicians
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { name: "Dr. Sarah Mitchell", role: "Pain Management Specialist", text: "The ALKINDI technology has transformed how we approach chronic pain. Results are immediate and measurable." },
                { name: "James Wilson", role: "Patient", text: "After years of back pain, the 15-minute treatment gave me relief I never thought possible. Completely painless!" },
                { name: "Dr. Maria Rodriguez", role: "Neurology Expert", text: "The scientific backing and precision of the 3D diagnostics make this the gold standard in spinal care." }
              ].map((testimonial, idx) => (
                <Card key={idx} className="border-2 hover:shadow-2xl transition-all duration-300 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
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

        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PublicPortal;
