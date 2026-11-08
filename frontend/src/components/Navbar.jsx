
import { Link } from "react-router-dom";


function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>✚</span> MediSlot
      </div>

      <div className="navbar-links">
        <Link to="/register">Register</Link>
        <Link to="/login">Login</Link>
        <Link to="/my-bookings">My Bookings</Link>
        <Link to="/slots">Slots</Link>
        <Link to="/admin">Admin</Link>
      </div>
    </nav>
  );
}

export default Navbar;

