import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import CommandPalette from '@/pages/Search/CommandPalette';
import FloatingChat from './FloatingChat';

const Layout = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Top Header containing Logo and Floating Pill Navbar */}
      <Header />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette search overlay */}
      <CommandPalette />

      {/* Global floating chatbot widget */}
      <FloatingChat />
    </div>
  );
};

export default Layout;
