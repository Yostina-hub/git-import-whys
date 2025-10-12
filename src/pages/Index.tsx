import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Shield, Activity, Clock, Users, Heart, CheckCircle, Calendar, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">ZEMAR Healthcare</h1>
                <p className="text-xs text-muted-foreground">SONIK Certified Treatment Center</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">Services</a>
              <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
              <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
              <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/register")} className="bg-primary hover:bg-primary/90">
                Book Appointment
              </Button>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Staff Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">ISO 27001 Certified Healthcare</span>
            </div>
            <h2 className="text-5xl font-bold mb-4 leading-tight">
              Transform Your Health with <span className="text-primary">SONIK Treatment</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience cutting-edge healthcare with our certified SONIK treatment protocol. Book your appointment online and start your journey to better health today.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => navigate("/register")} className="bg-primary hover:bg-primary/90">
                <Calendar className="h-5 w-5 mr-2" />
                Book Appointment Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mt-12">
              <div>
                <div className="text-3xl font-bold">10,000+</div>
                <div className="text-sm text-muted-foreground">Patients Treated</div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold">15+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-muted-foreground">Expert Team</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Card className="border-primary/20 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="inline-flex p-6 bg-primary/10 rounded-full mb-6">
                  <Heart className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Your Health, Our Priority</h3>
                <p className="text-muted-foreground">
                  State-of-the-art facilities with compassionate care
                </p>
              </CardContent>
            </Card>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 border border-green-200">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-sm">
                <div className="font-semibold">24/7 Support</div>
                <div className="text-muted-foreground">Always here for you</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section id="about" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose ZEMAR Healthcare?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We combine advanced technology, certified protocols, and compassionate care to deliver exceptional healthcare experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex p-3 bg-blue-500 rounded-xl mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">ISO 27001 Certified</h3>
                <p className="text-muted-foreground">
                  International standard for healthcare data security and privacy
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex p-3 bg-purple-500 rounded-xl mb-4">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">SONIK Treatment</h3>
                <p className="text-muted-foreground">
                  Certified process workflow for optimal treatment outcomes
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex p-3 bg-green-600 rounded-xl mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Quick Appointments</h3>
                <p className="text-muted-foreground">
                  Get scheduled within 24 hours with our efficient booking system
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex p-3 bg-orange-600 rounded-xl mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Expert Team</h3>
                <p className="text-muted-foreground">
                  Board-certified professionals with years of experience
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Services & Pricing */}
        <section id="services" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Services & Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Transparent pricing with no hidden fees. Choose the treatment level that is right for you.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Initial Consultation</CardTitle>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">$150</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    60 min
                  </div>
                </div>
                <CardDescription className="text-center">
                  Comprehensive assessment with treatment planning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Full medical history</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Physical examination</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Treatment recommendations</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Q&A session</span>
                </div>
                <Button className="w-full mt-4" variant="outline">Book Now</Button>
              </CardContent>
            </Card>

            <Card className="border-primary border-2 shadow-xl relative hover:shadow-2xl transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-center text-2xl">SONIK Level 1</CardTitle>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">$200</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    45 min
                  </div>
                </div>
                <CardDescription className="text-center">
                  Foundation level treatment protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Pre-assessment</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">SONIK therapy</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Post-treatment care</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Progress tracking</span>
                </div>
                <Button className="w-full mt-4 bg-primary hover:bg-primary/90">Book Now</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-center text-2xl">SONIK Level 2</CardTitle>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">$250</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    60 min
                  </div>
                </div>
                <CardDescription className="text-center">
                  Intermediate level treatment protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Advanced assessment</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Enhanced therapy</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Personalized care</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Follow-up support</span>
                </div>
                <Button className="w-full mt-4" variant="outline">Book Now</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-center text-2xl">SONIK Level 3</CardTitle>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">$300</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    75 min
                  </div>
                </div>
                <CardDescription className="text-center">
                  Advanced level treatment protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Complete evaluation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Premium therapy</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Comprehensive care</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </div>
                <Button className="w-full mt-4" variant="outline">Book Now</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-16">
          <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Health?</h2>
              <p className="text-xl mb-8 text-white/90">
                Join thousands of patients worldwide using ZEMAR Healthcare to achieve better health outcomes
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/register")} className="px-12">
                Book Your Appointment Today
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 ZEMAR Healthcare. Built with modern technology for healthcare excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
