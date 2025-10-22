import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Users,
  Settings,
  BarChart3,
  Lock,
  UserPlus,
  Key,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Keyboard,
  AlertTriangle,
} from "lucide-react";

export const AdminGuide = () => {
  const features = [
    {
      icon: UserPlus,
      title: "User Management",
      description: "Create and manage user accounts",
      steps: [
        "Navigate to Admin > User Management tab",
        "Click 'Create User' button",
        "Enter user details: name, email, phone, gender",
        "Assign appropriate role(s): Superadmin, Admin, Manager, Clinician, Nurse, Reception, or Billing",
        "Set initial password or auto-generate one",
        "Assign clinic access if multi-clinic setup",
        "Enable/disable user account as needed",
        "Click 'Create User' to save",
        "User receives email with login credentials",
      ],
      tips: [
        "Assign multiple roles if user has overlapping responsibilities",
        "Use strong passwords - minimum 8 characters with mix of types",
        "Review user list regularly to disable inactive accounts",
        "Clinic access controls which facility data users can see",
        "Superadmin role has full system access - use sparingly",
      ],
      shortcuts: [
        "Search users by name, email, or role",
        "Filter by role to see all users of specific type",
        "Quick edit from user list for fast updates",
        "Reset password anytime from user actions menu",
      ],
    },
    {
      icon: Lock,
      title: "Permissions Management",
      description: "Control access to system features",
      steps: [
        "Go to Admin > Permissions tab",
        "View permission matrix showing all roles and their access",
        "Understand role hierarchy (read-only view)",
        "Assign appropriate role when creating/editing users",
        "Test access by logging in with test account",
        "Review permissions regularly for security",
      ],
      tips: [
        "Roles are pre-configured with appropriate permissions",
        "Reception: Patient registration, appointments, billing",
        "Clinician: Clinical records, consultations, prescriptions",
        "Billing: Invoices, payments, financial reports only",
        "Admin: User management, configuration, full reports",
        "Superadmin: Everything including system settings",
        "Manager: Operations and resource management",
      ],
      shortcuts: [
        "Permission matrix provides quick reference for all roles",
        "Users only see sidebar items they have access to",
        "Unauthorized access attempts are logged for security",
        "Role descriptions explain each role's purpose",
      ],
    },
    {
      icon: Settings,
      title: "System Settings",
      description: "Configure global system parameters",
      steps: [
        "Access Admin > System Settings tab",
        "Configure facility information (name, address, contacts)",
        "Set default time zone and date formats",
        "Configure appointment durations and slots",
        "Set invoice numbering format and starting number",
        "Configure email/SMS notification settings",
        "Set data retention policies",
        "Enable/disable features as needed",
        "Save changes and test",
      ],
      tips: [
        "Changes to system settings affect entire facility",
        "Test settings in non-production environment first",
        "Document setting changes for audit trail",
        "Some settings require system restart to take effect",
        "Backup before making major configuration changes",
      ],
      shortcuts: [
        "Settings are organized by category for easy navigation",
        "Reset to defaults option available for each section",
        "Export settings for backup or replication",
        "Import settings from backup if needed",
      ],
    },
    {
      icon: ClipboardList,
      title: "Audit Logs",
      description: "Track user actions and system events",
      steps: [
        "Navigate to Admin > Audit Logs tab",
        "View chronological list of all system activities",
        "Filter by user, action type, date range",
        "Search for specific events or users",
        "Review security-related events regularly",
        "Export logs for compliance reporting",
        "Investigate suspicious activities",
      ],
      tips: [
        "All user actions are automatically logged",
        "Logs include: user, action, timestamp, IP address",
        "Review login failures for security monitoring",
        "Track data modifications for compliance",
        "Logs cannot be edited or deleted (security)",
        "Export logs monthly for long-term storage",
      ],
      shortcuts: [
        "Quick filters for common queries (logins, deletions, errors)",
        "Date range picker for specific time period",
        "Export to CSV for detailed analysis",
        "Alert notifications for critical events",
      ],
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Monitor system usage and performance",
      steps: [
        "Go to Admin > Analytics tab",
        "View key metrics: active users, appointments, revenue",
        "Analyze trends over time (daily, weekly, monthly)",
        "Monitor user activity and engagement",
        "Track feature adoption and usage patterns",
        "Identify performance bottlenecks",
        "Export analytics for reporting",
      ],
      tips: [
        "Check analytics weekly to spot trends early",
        "Compare periods to measure growth",
        "Low user activity may indicate training needs",
        "Peak usage times help with resource planning",
        "Feature usage data guides development priorities",
      ],
      shortcuts: [
        "Dashboard auto-refreshes with latest data",
        "Click charts for detailed breakdown",
        "Save favorite views for quick access",
        "Schedule automated reports via email",
      ],
    },
    {
      icon: Key,
      title: "Password Management",
      description: "Handle password resets and security",
      steps: [
        "Find user in User Management tab",
        "Click Actions > Reset Password",
        "Choose: Auto-generate or set custom password",
        "Password requirements: minimum 8 characters",
        "Option to force password change on next login",
        "User receives email with new credentials",
        "Verify user can login successfully",
      ],
      tips: [
        "Force password change for security after reset",
        "Auto-generated passwords are more secure",
        "Never share passwords via insecure channels",
        "Remind users to change default passwords immediately",
        "Implement password expiry policy (recommended 90 days)",
      ],
      shortcuts: [
        "Reset password directly from user list",
        "Bulk password reset for multiple users",
        "Password strength indicator guides users",
        "Login lockout after failed attempts prevents brute force",
      ],
    },
  ];

  const userRoles = [
    {
      role: "Superadmin",
      description: "Full system access including sensitive operations",
      permissions: ["Everything", "User management", "System configuration", "Security settings"],
      badge: "destructive",
    },
    {
      role: "Admin",
      description: "Administrative access for day-to-day management",
      permissions: ["User management", "Configuration", "Reports", "Audit logs"],
      badge: "default",
    },
    {
      role: "Manager",
      description: "Operational management and resource coordination",
      permissions: ["Resources", "Schedules", "Queue management", "Reports"],
      badge: "default",
    },
    {
      role: "Clinician",
      description: "Healthcare providers (doctors, specialists)",
      permissions: ["Clinical records", "Consultations", "Prescriptions", "Orders"],
      badge: "default",
    },
    {
      role: "Nurse",
      description: "Nursing staff for triage and clinical support",
      permissions: ["Triage", "Vitals", "Medications", "Clinical notes"],
      badge: "default",
    },
    {
      role: "Reception",
      description: "Front desk and patient coordination",
      permissions: ["Patient registration", "Appointments", "Queue", "Basic billing"],
      badge: "default",
    },
    {
      role: "Billing",
      description: "Financial and billing operations",
      permissions: ["Invoices", "Payments", "Refunds", "Financial reports"],
      badge: "default",
    },
  ];

  const securityBestPractices = [
    "Enable two-factor authentication for admin accounts",
    "Review user access permissions quarterly",
    "Disable accounts for departed staff immediately",
    "Use complex passwords with regular rotation",
    "Monitor audit logs for suspicious activity",
    "Limit superadmin role to essential personnel only",
    "Implement IP whitelisting for sensitive operations",
    "Regular security audits and vulnerability assessments",
    "Train staff on security best practices",
    "Backup user data regularly",
  ];

  const faqs = [
    {
      q: "How do I remove a user who left the organization?",
      a: "Never delete users (for audit trail). Instead, disable their account: Go to User Management > find user > Actions > Disable Account. This prevents login while preserving all historical data and activity logs. You can re-enable if needed.",
    },
    {
      q: "Can a user have multiple roles?",
      a: "Yes! Users can have multiple roles if they perform different functions. For example, a doctor who also manages the clinic can be assigned both 'Clinician' and 'Manager' roles. Their permissions will be the combination of all assigned roles.",
    },
    {
      q: "What's the difference between Admin and Superadmin?",
      a: "Superadmin has unrestricted access to everything including critical security settings, database configuration, and system-wide changes. Admin has broad access but with safety limits on critical operations. Use Superadmin sparingly - typically only for the facility owner or IT director.",
    },
    {
      q: "How do I recover if I accidentally locked out an admin?",
      a: "Login with your Superadmin account or another Admin account. Navigate to User Management, find the locked user, and click 'Reset Password' or 'Unlock Account'. If all admins are locked, contact system support for emergency access.",
    },
    {
      q: "Can I customize role permissions?",
      a: "Currently, roles have predefined permissions designed for security and compliance. If you need custom access patterns, assign multiple roles or contact support about custom role configuration. This ensures consistent security policies across the system.",
    },
    {
      q: "How long are audit logs retained?",
      a: "Audit logs are retained for 1 year by default (configurable in System Settings). After retention period, logs are automatically archived. For compliance, export logs monthly to external storage. Critical security events are retained indefinitely.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl">Administration Guide</CardTitle>
              <CardDescription className="text-base mt-1">
                Master user management, permissions, and system configuration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Security Warning */}
      <Card className="border-2 border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Important Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>⚠️ Administrative access controls sensitive patient and financial data.</p>
          <p>✓ Always follow the principle of least privilege - grant only necessary permissions.</p>
          <p>✓ Review audit logs regularly for unauthorized access attempts.</p>
          <p>✓ Never share admin credentials or login from untrusted devices.</p>
          <p>✓ Report security concerns immediately to facility management.</p>
        </CardContent>
      </Card>

      {/* User Roles Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Roles & Permissions
          </CardTitle>
          <CardDescription>Understanding access levels and responsibilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userRoles.map((role) => (
            <div key={role.role} className="p-4 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge variant={role.badge as any} className="mb-2">{role.role}</Badge>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {role.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detailed Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Feature Guides
          </CardTitle>
          <CardDescription>Step-by-step administration instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {features.map((feature, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{feature.title}</div>
                      <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    {/* Steps */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        Step-by-Step Guide
                      </h4>
                      <div className="space-y-2">
                        {feature.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors">
                            <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                            <p className="text-sm flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Pro Tips */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Pro Tips
                      </h4>
                      <div className="space-y-2">
                        {feature.tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Shortcuts */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Keyboard className="h-4 w-4 text-primary" />
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        {feature.shortcuts.map((shortcut, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm p-2 rounded bg-accent/5">
                            <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{shortcut}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card className="border-2 border-accent/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Security Best Practices
          </CardTitle>
          <CardDescription>Essential security guidelines for administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {securityBestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-accent/5">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>{practice}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">{faq.q}</h4>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
