import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">📅 BookIt</Link>
      <nav>
        {user ? (
          <>
            <NavLink to="/">Book a slot</NavLink>
            <NavLink to="/my-bookings">My bookings</NavLink>
            {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
            <span className="user-name">{user.name}</span>
            <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
