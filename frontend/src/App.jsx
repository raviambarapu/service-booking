
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Slots from "./pages/Slots";
import MyBookings from "./pages/MyBookings";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/slots" element={<Slots />} />
      <Route path="/my-bookings" element={<MyBookings />} />

      <Route path="/admin" element={<Admin />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

