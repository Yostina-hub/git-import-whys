import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  Calendar,
  DollarSign,
  ClipboardList,
  FileText,
  List,
  Stethoscope,
  Mail,
  Shield,
  LayoutDashboard,
  Activity,
  Package,
  ShoppingCart,
  ClipboardCheck,
  Building2,
  Settings,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserRole, UserRole } from "@/hooks/useUserRole";

interface AppSidebarProps {
  isAdmin: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon: any;
  roles: UserRole[];
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "superadmin", "manager", "clinician", "nurse", "reception", "billing"] },
  { title: "Patients", url: "/patients", icon: Users, roles: ["admin", "superadmin", "clinician", "nurse", "reception", "billing"] },
  { title: "Visits", url: "/visits", icon: ClipboardCheck, roles: ["admin", "superadmin", "clinician", "nurse", "reception"] },
  { title: "Appointments", url: "/appointments", icon: Calendar, roles: ["admin", "superadmin", "clinician", "reception"] },
  { title: "Queue", url: "/queue", icon: List, roles: ["admin", "superadmin", "clinician", "nurse", "reception"] },
  { title: "Triage Queue", url: "/triage-queue", icon: Stethoscope, roles: ["admin", "superadmin", "nurse", "clinician"] },
  { title: "Doctor Queue", url: "/doctor-queue", icon: Stethoscope, roles: ["admin", "superadmin", "clinician"] },
];

const clinicalNavItems: NavItem[] = [
  { title: "Clinical Records", url: "/clinical", icon: FileText, roles: ["admin", "superadmin", "clinician", "nurse"] },
  { title: "Orders", url: "/orders", icon: Stethoscope, roles: ["admin", "superadmin", "clinician"] },
  { title: "Doctors", url: "/doctors", icon: Stethoscope, roles: ["admin", "superadmin", "manager", "clinician"] },
];

const operationsNavItems: NavItem[] = [
  { title: "Billing", url: "/billing", icon: DollarSign, roles: ["admin", "superadmin", "billing", "manager"] },
  { title: "Reports", url: "/reports", icon: ClipboardList, roles: ["admin", "superadmin", "manager", "billing"] },
  { title: "Communications", url: "/communications", icon: Mail, roles: ["admin", "superadmin", "reception", "manager"] },
];

const adminNavItems: NavItem[] = [
  { title: "Services", url: "/services", icon: ShoppingCart, roles: ["admin", "superadmin"] },
  { title: "Packages", url: "/packages", icon: Package, roles: ["admin", "superadmin"] },
  { title: "Resources", url: "/resources", icon: Building2, roles: ["admin", "superadmin", "manager"] },
  { title: "Configuration", url: "/configuration", icon: Settings, roles: ["admin", "superadmin"] },
  { title: "Administration", url: "/admin", icon: Shield, roles: ["admin", "superadmin", "manager"] },
];

const helpNavItems: NavItem[] = [
  { title: "User Guide", url: "/user-guide", icon: BookOpen, roles: ["admin", "superadmin", "manager", "clinician", "nurse", "reception", "billing"] },
];

export function AppSidebar({ isAdmin }: AppSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { roles, hasAnyRole } = useUserRole();

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (path: string) =>
    isActive(path)
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50";

  // Filter nav items based on user roles
  const filterItemsByRole = (items: NavItem[]) => 
    items.filter(item => hasAnyRole(item.roles));

  const filteredMainItems = filterItemsByRole(mainNavItems);
  const filteredClinicalItems = filterItemsByRole(clinicalNavItems);
  const filteredOperationsItems = filterItemsByRole(operationsNavItems);
  const filteredAdminItems = filterItemsByRole(adminNavItems);
  const filteredHelpItems = filterItemsByRole(helpNavItems);

  return (
    <Sidebar collapsible="none" className="w-64 border-r">
      <SidebarContent className="gap-0 bg-sidebar">
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-sidebar-foreground">Zemar</span>
              <span className="text-xs text-muted-foreground">EMR System</span>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        {filteredMainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Clinical Navigation */}
        {filteredClinicalItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Clinical</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredClinicalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Operations Navigation */}
        {filteredOperationsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredOperationsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Navigation */}
        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Help Navigation */}
        {filteredHelpItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Help</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredHelpItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
