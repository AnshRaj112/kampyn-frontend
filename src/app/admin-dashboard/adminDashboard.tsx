'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import styles from './styles/adminDashboard.module.scss';

// Icons as React components
const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);


const PercentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BarChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const MonitorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

interface DashboardOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
}

const AdminDashboard: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const adminToken = null;
    if (!adminToken) {
      router.push('/admin-login');
    }
  }, [router]);

  const handleLogout = () => {
    void 0;
    router.push('/admin-login');
  };

  const dashboardOptions: DashboardOption[] = [
    {
      id: 'check-colleges',
      title: 'Check Colleges',
      description: 'View and manage all registered colleges',
      icon: <BuildingIcon />,
      color: 'bg-blue-500',
      onClick: () => router.push('/admin-dashboard/colleges')
    },
    {
      id: 'add-college',
      title: 'Add New College',
      description: 'Register a new college in the system',
      icon: <PlusIcon />,
      color: 'bg-green-500',
      onClick: () => router.push('/admin-dashboard/colleges/add')
    },
    {
      id: 'check-backlog',
      title: 'Check Backlog',
      description: 'Review pending orders and unresolved issues',
      icon: <ClockIcon />,
      color: 'bg-yellow-500',
      onClick: () => setSelectedOption('check-backlog')
    },
    {
      id: 'features-services',
      title: 'Features & Services',
      description: 'Manage features and their services',
      icon: <SettingsIcon />,
      color: 'bg-gray-700',
      onClick: () => router.push('/admin-dashboard/services')
    },
    {
      id: 'check-invoices',
      title: 'Platform Invoices',
      description: 'View and manage platform fee invoices and earnings',
      icon: <FileTextIcon />,
      color: 'bg-purple-500',
      onClick: () => router.push('/admin-dashboard/invoices')
    },
    {
      id: 'platform-fees',
      title: 'Platform Fee Management',
      description: 'Set and manage platform fees for each university',
      icon: <PercentIcon />,
      color: 'bg-orange-500',
      onClick: () => router.push('/admin-dashboard/platform-fees')
    },
    {
      id: 'help-messages',
      title: 'Help Messages',
      description: 'View and manage customer support messages',
      icon: <MessageSquareIcon />,
      color: 'bg-teal-500',
      onClick: () => router.push('/admin-dashboard/help-messages')
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <UserIcon />,
      color: 'bg-pink-500',
      onClick: () => setSelectedOption('user-management')
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'View detailed analytics and reports',
      icon: <BarChartIcon />,
      color: 'bg-cyan-500',
      onClick: () => setSelectedOption('analytics')
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: <SettingsIcon />,
      color: 'bg-gray-500',
      onClick: () => setSelectedOption('system-settings')
    },
    {
      id: 'security',
      title: 'Security Center',
      description: 'Monitor security logs and manage access controls',
      icon: <ShieldIcon />,
      color: 'bg-red-500',
      onClick: () => setSelectedOption('security')
    },
    {
      id: 'rate-limits',
      title: 'Rate Limit Management',
      description: 'View and release rate-limited IP addresses',
      icon: <ShieldIcon />,
      color: 'bg-amber-500',
      onClick: () => router.push('/admin-dashboard/rate-limits')
    },
    {
      id: 'server-monitoring',
      title: 'Server Monitoring',
      description: 'Monitor backend status, API hits, crashes, and server events',
      icon: <MonitorIcon />,
      color: 'bg-indigo-500',
      onClick: () => router.push('/admin-dashboard/monitoring')
    }
  ];

  const handleOptionClick = (option: DashboardOption) => {
    setSelectedOption(option.id);
    if (option.onClick) {
      option.onClick();
    }
  };

  return (
    <div className={styles.adminDashboard}>
      {/* Welcome Header */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>Hello Ansh</h1>
          <p className={styles.welcomeSubtitle}>Welcome to your Admin Dashboard</p>
          <div className={styles.headerActions}>
            <Badge variant="outline" className={styles.statusBadge}>
              Administrator Access
            </Badge>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Options Grid */}
      <div className={styles.optionsGrid}>
        {dashboardOptions.map((option) => (
          <Card
            key={option.id}
            className={`${styles.optionCard} ${selectedOption === option.id ? styles.selectedCard : ''}`}
            onClick={() => handleOptionClick(option)}
          >
            <CardHeader className={styles.cardHeader}>
              <div className={`${styles.iconContainer} ${option.color}`}>
                {option.icon}
              </div>
              <CardTitle className={styles.cardTitle}>{option.title}</CardTitle>
              <CardDescription className={styles.cardDescription}>
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.cardContent}>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Option Display */}
      {selectedOption && (
        <div className={styles.selectedOptionDisplay}>
          <Card>
            <CardHeader>
              <CardTitle>
                {dashboardOptions.find(opt => opt.id === selectedOption)?.title}
              </CardTitle>
              <CardDescription>
                {dashboardOptions.find(opt => opt.id === selectedOption)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.placeholderContent}>
                <p>This feature is currently under development.</p>
                <p>Click on another option to explore different functionalities.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          KAMPYN Admin Dashboard - Secure Access
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
