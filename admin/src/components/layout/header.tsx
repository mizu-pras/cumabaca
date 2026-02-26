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
      } else if (/^\d+$/.test(name)) {
        // Numeric ID - add "Details" breadcrumb instead of hiding the ID
        breadcrumbs.push({
          label: 'Details',
          path: currentPath,
          isLast: true,
        });
        return; // Skip adding the ID as a breadcrumb
      } else {
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: isLast,
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
            <>
              <BreadcrumbItem key={crumb.path}>
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
            </>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

export default Header;
