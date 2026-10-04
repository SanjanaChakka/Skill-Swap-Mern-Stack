import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePage from './pages/BrowsePage';
import ListingDetailPage from './pages/ListingDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import MyListingsPage from './pages/MyListingsPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import DashboardPage from './pages/DashboardPage';
import SwapsPage from './pages/SwapsPage';
import SwapDetailPage from './pages/SwapDetailPage';
import MessagingPage from './pages/MessagingPage';
import NotificationsPage from './pages/NotificationsPage';
import FeedPage from './pages/FeedPage';
import SavedPage from './pages/SavedPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

function AdminBackButton() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return null;
  return (
    <Link to="/admin" className="admin-back-float" title="Go back to the admin panel">
      🛡️ Admin panel
    </Link>
  );
}

function UserShell() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
      <AdminBackButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminPage />} />
            </Route>

            <Route element={<UserShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
              <Route path="/profile/:id" element={<PublicProfilePage />} />
              <Route path="/feed" element={<FeedPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/me" element={<ProfilePage />} />
                <Route path="/me/settings" element={<SettingsPage />} />
                <Route path="/me/listings" element={<MyListingsPage />} />
                <Route path="/listings/new" element={<CreateListingPage />} />
                <Route path="/listings/:id/edit" element={<CreateListingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/swaps" element={<SwapsPage />} />
                <Route path="/swaps/:id" element={<SwapDetailPage />} />
                <Route path="/messages" element={<MessagingPage />} />
                <Route path="/messages/:conversationId" element={<MessagingPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/saved" element={<SavedPage />} />
              </Route>
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
