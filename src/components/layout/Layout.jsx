import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from '@/pages/Search/CommandPalette';

const Layout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main page frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Sticky Page Header */}
        <Header />

        {/* Scrollable Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette search overlay */}
      <CommandPalette />
    </div>
  );
};

export default Layout;
