import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Users, Calendar, DollarSign, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SONIK EMR</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Login / Sign Up
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Complete EMR & Clinic Management System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Streamline your clinic operations with our comprehensive electronic medical records system. 
            Manage patients, appointments, billing, and clinical workflows all in one place.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
            Get Started
          </Button>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>
                Complete patient registration, demographics, and medical history tracking with auto-generated MRNs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>
                Efficient appointment booking, calendar management, and automated reminders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <DollarSign className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>
                Comprehensive invoicing, payment processing, packages, and refund management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Security & Compliance</CardTitle>
              <CardDescription>
                Role-based access control, encrypted data, and HIPAA-ready infrastructure
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="bg-card rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Key Features</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Clinical Workflows</h3>
                <p className="text-sm text-muted-foreground">S1/S2/S3 assessments, treatment protocols, and encounter documentation</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Multi-User Access</h3>
                <p className="text-sm text-muted-foreground">Admin, Reception, Clinician, Billing, and Manager roles</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Scheduling</h3>
                <p className="text-sm text-muted-foreground">Conflict prevention, provider availability, and automated follow-ups</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Flexible Billing</h3>
                <p className="text-sm text-muted-foreground">Multiple payment methods, packages, installments, and refund handling</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Data Security</h3>
                <p className="text-sm text-muted-foreground">Encrypted storage, audit trails, and comprehensive access controls</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Reports & Analytics</h3>
                <p className="text-sm text-muted-foreground">Revenue tracking, patient trends, and operational metrics</p>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Transform Your Clinic?</CardTitle>
              <CardDescription className="text-lg">
                Join clinics worldwide using SONIK EMR to deliver better patient care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => navigate("/auth")} className="px-12">
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 SONIK EMR. Built with modern technology for healthcare excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
