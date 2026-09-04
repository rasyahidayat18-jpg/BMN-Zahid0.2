import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/common";
import Layout from "@/components/Layout";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Roles from "@/pages/Roles";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import AuditTrail from "@/pages/AuditTrail";
import Reports from "@/pages/Reports";

import AssetList from "@/pages/assets/AssetList";
import AssetForm from "@/pages/assets/AssetForm";
import AssetDetail from "@/pages/assets/AssetDetail";
import Responsibles from "@/pages/assets/Responsibles";
import Locations from "@/pages/assets/Locations";

import MaintenanceList from "@/pages/maintenance/MaintenanceList";
import MaintenanceForm from "@/pages/maintenance/MaintenanceForm";
import MaintenanceApproval from "@/pages/maintenance/MaintenanceApproval";
import MaintenanceDetail from "@/pages/maintenance/MaintenanceDetail";

import InventoryForm from "@/pages/inventory/InventoryForm";
import InventoryApproval from "@/pages/inventory/InventoryApproval";
import InventoryList from "@/pages/inventory/InventoryList";
import InventoryDetail from "@/pages/inventory/InventoryDetail";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* BMN */}
        <Route path="/aset" element={<AssetList />} />
        <Route path="/aset/tambah" element={<AssetForm />} />
        <Route path="/aset/:id" element={<AssetDetail />} />
        <Route path="/aset/:id/edit" element={<AssetForm />} />
        <Route path="/penanggung-jawab" element={<Responsibles />} />
        <Route path="/lokasi" element={<Locations />} />

        {/* Pemeliharaan */}
        <Route path="/pemeliharaan" element={<MaintenanceList />} />
        <Route path="/pemeliharaan/ajukan" element={<MaintenanceForm />} />
        <Route path="/pemeliharaan/approval" element={<MaintenanceApproval />} />
        <Route path="/pemeliharaan/riwayat" element={<MaintenanceList historyMode />} />
        <Route path="/pemeliharaan/:id" element={<MaintenanceDetail />} />

        {/* Persediaan */}
        <Route path="/persediaan/ajukan" element={<InventoryForm />} />
        <Route path="/persediaan/approval" element={<InventoryApproval />} />
        <Route path="/persediaan/monitoring" element={<InventoryList monitorMode />} />
        <Route path="/persediaan/riwayat" element={<InventoryList />} />
        <Route path="/persediaan/:id" element={<InventoryDetail />} />

        {/* Admin */}
        <Route path="/notifikasi" element={<Notifications />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/laporan" element={<Reports />} />
        <Route path="/audit" element={<AuditTrail />} />
        <Route path="/pengaturan" element={<Settings />} />
        <Route path="/profil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
