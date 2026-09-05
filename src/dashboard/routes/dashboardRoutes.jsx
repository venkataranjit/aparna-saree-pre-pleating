import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Overview from '../pages/Overview/Overview';
import Bookings from '../pages/Bookings/Bookings';
import Services from '../pages/Services/Services';
import Users from '../pages/Users/Users';
import Customers from '../pages/Customers/Customers';
import MyProfile from '../pages/MyProfile/MyProfile';

export const dashboardRoutes = [
  {
    path: '/dashboard',
    element: <DashboardLayout />,
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
        path: 'customers',
        element: <Customers />,
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
