import {
  Home,
  Globe,
  Link2,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navData: NavGroup[] = [
  {
    title: 'Management',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      },
      {
        title: 'Languages',
        href: '/languages',
        icon: Globe,
      },
      {
        title: 'Websites',
        href: '/websites',
        icon: Link2,
      },
      {
        title: 'Komiks',
        href: '/komiks',
        icon: BookOpen,
      },
    ],
  },
];

export const sidebarTitle = 'Cuma Baca';
export const sidebarSubtitle = 'Admin Panel';
