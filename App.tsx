
import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './screens/Home';
import { MyTrip } from './screens/MyTrip';
import { Itinerary } from './screens/Itinerary';
import { Vouchers } from './screens/Vouchers';
import { Profile } from './screens/Profile';
import { Welcome } from './screens/Welcome';
import { UploadDocument } from './screens/UploadDocument';
import { Points } from './screens/Points';
import { Notifications } from './screens/Notifications';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';

// Admin imports
import { AdminLayout } from './screens/admin/AdminLayout';
import { AdminDashboard } from './screens/admin/Dashboard';
import { AdminPassengers } from './screens/admin/Passengers';
import { AdminTrips } from './screens/admin/Trips';
import { AdminVouchers } from './screens/admin/Vouchers';
import { AdminPoints } from './screens/admin/Points';
import { AdminCommunications } from './screens/admin/Communications';
import { AdminUsers } from './screens/admin/Users';
import { AdminSettings } from './screens/admin/Settings';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Skip layout for admin routes and specific paths
  const hideNavOn = ['/welcome', '/upload', '/admin'];
  const showNav = !hideNavOn.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - Always visible on lg+ screens */}
      {showNav && (
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:bg-white lg:dark:bg-zinc-900 lg:border-r lg:border-zinc-100 lg:dark:border-zinc-800">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Sidebar isOpen={true} onClose={() => { }} />
          </div>
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {showNav && (
        <div className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 ${showNav ? 'lg:ml-72' : ''}`}>
        {showNav && (
          <div className="lg:hidden">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
          </div>
        )}

        {/* Desktop Header */}
        {showNav && (
          <header className="hidden lg:flex lg:items-center lg:justify-between lg:h-16 lg:px-8 lg:bg-white lg:dark:bg-zinc-900 lg:border-b lg:border-zinc-100 lg:dark:border-zinc-800 lg:sticky lg:top-0 lg:z-40">
            <h1 className="text-lg font-bold text-zinc-800 dark:text-white">
              {location.pathname === '/' ? 'Inicio' :
                location.pathname === '/mytrip' ? 'Mi Viaje' :
                  location.pathname === '/itinerary' ? 'Itinerario' :
                    location.pathname === '/vouchers' ? 'Documentos' :
                      location.pathname === '/points' ? 'Mis Puntos' :
                        location.pathname === '/profile' ? 'Perfil' :
                          location.pathname === '/notifications' ? 'Notificaciones' : ''}
            </h1>
            <button className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </header>
        )}

        <main className={`flex-1 ${showNav ? 'pb-24 lg:pb-8' : ''}`}>
          {children}
        </main>

        {/* Bottom Nav - Hidden on desktop */}
        {showNav && <div className="lg:hidden"><BottomNav /></div>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Admin Routes - No passenger layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="passengers" element={<AdminPassengers />} />
          <Route path="trips" element={<AdminTrips />} />
          <Route path="vouchers" element={<AdminVouchers />} />
          <Route path="points" element={<AdminPoints />} />
          <Route path="communications" element={<AdminCommunications />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Passenger Routes - With layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/mytrip" element={<MyTrip />} />
              <Route path="/itinerary" element={<Itinerary />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/points" element={<Points />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/upload" element={<UploadDocument />} />
              <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
