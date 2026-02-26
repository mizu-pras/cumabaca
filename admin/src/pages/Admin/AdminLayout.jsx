import { Outlet } from 'react-router';
import { SidebarProvider, useSidebar } from '../../components/ui/sidebar-provider';
import { SidebarInset } from '../../components/ui/sidebar-inset';
import AppSidebar from '../../components/layout/app-sidebar';
import Header from '../../components/layout/header';

function AdminLayoutContent() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </>
  );
}

function AdminLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <AdminLayoutContent />
      </div>
    </SidebarProvider>
  );
}

export default AdminLayout;
