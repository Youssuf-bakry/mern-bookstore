import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Navigation() {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="nav-icon">📚</span>
          <span className="nav-title">علم ينتفع به</span>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span className="nav-link-icon">🏠</span>
            المكتبة
          </Link>
          
          {isAdmin() && (
            <Link 
              to="/admin" 
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <span className="nav-link-icon">⚙️</span>
              لوحة تحكم الأدمن
            </Link>
          )}
          
          {user ? (
            <div className="nav-user">
              <button onClick={logout} className="nav-logout">
                <span className="nav-link-icon">🚪</span>
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              <span className="nav-link-icon">🔐</span>
              دخول الأدمن
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
export default Navigation;