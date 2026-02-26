import { useNavigate, useLocation } from 'react-router';
import { SidebarTrigger } from '../ui/sidebar-trigger';
import { useSidebar } from '../ui/sidebar-provider';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggle } = useSidebar();

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    const breadcrumbs = [];
    let currentPath = '';

    // Always add Dashboard as first breadcrumb (except if already on dashboard)
    if (pathnames[0] !== 'dashboard') {
      breadcrumbs.push({
        label: 'Dashboard',
        path: '/dashboard',
        isLast: false,
      });
    }

    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      const isLast = index === pathnames.length - 1;

      // Format label: capitalize first letter, handle special cases
      let label = name;
      if (name === 'new') {
        label = 'New';
      } else if (name === 'edit') {
        label = 'Edit';
      } else {
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      // Don't show ID in breadcrumb for detail pages
      if (/^\d+$/.test(name) && pathnames[index - 1]) {
        const parentName = pathnames[index - 1].charAt(0).toUpperCase() + pathnames[index - 1].slice(1);
        const prevBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        if (prevBreadcrumb) {
          prevBreadcrumb.label = `${parentName} Details`;
          return; // Skip this iteration as we modified the previous breadcrumb
        }
      }

      breadcrumbs.push({
        label,
        path: currentPath,
        isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger isOpen={isOpen} onToggle={toggle} />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    asChild
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(crumb.path);
                    }}
                    className="cursor-pointer hover:text-foreground"
                  >
                    <span>{crumb.label}</span>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

export default Header;
