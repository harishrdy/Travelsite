import { Outlet } from 'react-router-dom';
import AdminSidebar from './SIDEBAR ADMIN/sidebar_admin';
import AdminTopbar from './TOPBAR ADMIN/Topbar';
import './adminlayout.css';

function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="main-area">
        <AdminTopbar />
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
