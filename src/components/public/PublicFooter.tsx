import { Mail, Phone, MapPin, Heart, Facebook, Twitter, Instagram, Linkedin, Clock, Shield, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50">
                  <Heart className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                    HealthCare+
                  </h3>
                  <p className="text-xs text-blue-200">Advanced Medical Solutions</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Revolutionizing healthcare through innovation, compassion, and cutting-edge technology. 
                Your health is our mission.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, color: "from-blue-400 to-blue-600" },
                  { icon: Twitter, color: "from-sky-400 to-sky-600" },
                  { icon: Instagram, color: "from-pink-400 to-purple-600" },
                  { icon: Linkedin, color: "from-blue-500 to-indigo-600" }
                ].map(({ icon: Icon, color }, idx) => (
                  <button
                    key={idx}
                    className={`p-2 rounded-lg bg-gradient-to-br ${color} hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded" />
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  "About Us",
                  "Our Services",
                  "Medical Team",
                  "Specialties",
                  "Patient Resources",
                  "Insurance & Billing"
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to="#"
                      className="text-sm text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <div className="h-1 w-0 group-hover:w-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded transition-all duration-300" />
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded" />
                Contact Us
              </h4>
              <div className="space-y-4">
                {[
                  { icon: MapPin, text: "123 Healthcare Avenue, Medical District, City 12345", color: "from-green-400 to-emerald-600" },
                  { icon: Phone, text: "+1 (555) 123-4567", color: "from-blue-400 to-cyan-600" },
                  { icon: Mail, text: "contact@healthcare.com", color: "from-purple-400 to-pink-600" },
                  { icon: Clock, text: "24/7 Emergency Services", color: "from-orange-400 to-red-600" }
                ].map(({ icon: Icon, text, color }, idx) => (
                  <div key={idx} className="flex items-start gap-3 group">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors pt-2">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications & Trust Badges */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-green-400 to-teal-400 rounded" />
                Accreditations
              </h4>
              <div className="space-y-4">
                {[
                  { icon: Shield, text: "HIPAA Compliant", color: "from-green-400 to-emerald-600" },
                  { icon: Award, text: "JCI Accredited", color: "from-yellow-400 to-orange-600" },
                  { icon: Users, text: "100K+ Patients Served", color: "from-blue-400 to-indigo-600" }
                ].map(({ icon: Icon, text, color }, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <p className="text-xs text-green-200 text-center">
                  Your data is secure with 256-bit encryption
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400 animate-pulse" />
                <p className="text-sm text-gray-300">
                  © {currentYear} HealthCare+. Made with love for better health.
                </p>
              </div>
              <div className="flex gap-6 text-sm text-gray-300">
                <Link to="#" className="hover:text-white transition-colors hover:underline">
                  Privacy Policy
                </Link>
                <Link to="#" className="hover:text-white transition-colors hover:underline">
                  Terms of Service
                </Link>
                <Link to="#" className="hover:text-white transition-colors hover:underline">
                  Accessibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};