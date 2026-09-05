import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { dashboardRoutes } from './dashboard/routes/dashboardRoutes';
import { landingRoutes } from './landing-page/routes/landingRoutes';
import NotFound from './dashboard/pages/NotFound/NotFound';
import './App.scss';

function App() {
  return (
    <div className="app-root">
      <Routes>
        {/* Default route points directly to dashboard since dashboard is active */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard module routes */}
        {dashboardRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element}>
            {route.children?.map((child) => (
              <Route
                key={child.index ? 'index' : child.path}
                index={child.index}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ))}

        {/* Landing page module routes */}
        {landingRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
