
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import TransportadoraDashboard from '@/components/TransportadoraDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import PortariaDashboard from '@/components/PortariaDashboard';

const Index = () => {
  const { user } = useAuth();

  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Show appropriate dashboard based on user type
  if (user.type === 'admin') {
    return <AdminDashboard />;
  }

  if (user.type === 'portaria') {
    return <PortariaDashboard />;
  }

  return <TransportadoraDashboard />;
};

export default Index;
