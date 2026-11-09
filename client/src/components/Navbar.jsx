import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🩸 Sweety
      </Link>
      <div className="navbar-user">
        {user ? (
          <>
            <div className="navbar-links">
              <Link to="/dashboard" className={isActive('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/reports" className={isActive('/reports')}>
                Reports
              </Link>
            </div>
            <span className="navbar-user-name">👋 {user.name}</span>
            <button className="navbar-logout-btn" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <div className="navbar-links">
            <Link to="/login" className={isActive('/login')}>
              Login
            </Link>
            <Link to="/register" className={isActive('/register')}>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
