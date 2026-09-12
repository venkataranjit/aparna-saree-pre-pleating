import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../../components/routes/ProtectedRoute';
import Overview from '../pages/Overview/Overview';
import Bookings from '../pages/Bookings/Bookings';
import Services from '../pages/Services/Services';
import Users from '../pages/Users/Users';
import Clients from '../pages/Clients/Clients';
import Expenses from '../pages/Expenses/Expenses';
import MyProfile from '../pages/MyProfile/MyProfile';
import HelpSupport from '../pages/HelpSupport/HelpSupport';

export const dashboardRoutes = [
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Overview />,
      },
      {
        path: 'bookings',
        element: <Bookings />,
      },
      {
        path: 'services',
        element: <Services />,
      },
      {
        path: 'clients',
        element: <Clients />,
      },
      {
        path: 'expenses',
        element: <Expenses />,
      },
      {
        path: 'support',
        element: <HelpSupport />,
      },
      {
        path: 'profile',
        element: <MyProfile />,
      },
      {
        path: 'settings',
        element: <Overview />,
      },
      {
        path: 'users',
        element: <Users />,
      },
    ],
  },
];
