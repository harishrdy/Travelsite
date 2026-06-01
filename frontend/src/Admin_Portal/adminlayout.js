import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './SIDEBAR ADMIN/sidebar_admin';
import AdminTopbar from './TOPBAR ADMIN/Topbar';
import './adminlayout.css';

function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="admin-shell">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="main-area">
        <AdminTopbar 
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <Outlet context={{ searchQuery, setSearchQuery }} />
      </main>
    </div>
  );
}

export default AdminLayout;
