import { NavLink, useLocation } from 'react-router';
import { Home, Globe, Link2, BookOpen, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '../ui/sidebar';
import { useAuthStore } from '../../stores/authStore';
import { NavUser } from './nav-user';

const menuItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/languages', icon: Globe, label: 'Languages' },
  { path: '/websites', icon: Link2, label: 'Websites' },
  { path: '/komiks', icon: BookOpen, label: 'Komiks' },
];

function AppSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <Sidebar className="bg-background border-border">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold text-lg">CB</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Cuma Baca</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                >
                  <NavLink to={item.path}>
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
