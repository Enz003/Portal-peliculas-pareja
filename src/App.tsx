import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/Dashboard';
import { SharedPage } from './pages/Shared';
import { MyTierPage, PartnerTierPage } from './pages/Tier';
import { MyFavoritesPage, PartnerFavoritesPage } from './pages/Favorites';
import { SettingsPage } from './pages/Settings';
import { NewMoviePage } from './pages/NewMovie';

import { LoginPage } from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shared" element={<SharedPage />} />
        <Route path="movie/new" element={<NewMoviePage />} />

        <Route path="me">
          <Route path="tier" element={<MyTierPage />} />
          <Route path="favorites" element={<MyFavoritesPage />} />
        </Route>

        <Route path="partner">
          <Route path="tier" element={<PartnerTierPage />} />
          <Route path="favorites" element={<PartnerFavoritesPage />} />
        </Route>

        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
