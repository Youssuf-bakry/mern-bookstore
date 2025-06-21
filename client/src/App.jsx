import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { AuthProvider, useAuth } from './comp/AuthContext';
import AdminPanel from './comp/AdminPanel';
import Login from './comp/Login';
import ProtectedRoute from './comp/ProtectedRoute';
import CardComponent from './comp/CardComponent';
import './App.css';

// Library Component (your existing book list)
function Library() {
  const [books, setBooks] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch('https://mern-bookstore-backend-amt0.onrender.com/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        console.log('Books loaded:', data.length);
      })
      .catch(err => {
        console.error('Error loading books:', err);
        alert('Failed to load books. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (bookId, title) => {
    if (downloading === bookId) return;

    try {
      setDownloading(bookId);
      
      // Use proxy URL instead of direct backend URL
      const response = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books/${bookId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري تحميل المكتبة ...</p>
      </div>
    );
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="title-icon">📚</span>
          مكتبة الدكتور رؤوف شلبي
          </h1>
          <p className="subtitle">Discover and download your favorite books</p>
        </div>
      </header>

      <main className="main">
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search books or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="stats">
            {searchTerm ? (
              <span>{filteredBooks.length} of {books.length} books</span>
            ) : (
              <span>{books.length} books available</span>
            )}
          </div>
        </div>

        <div className="books-grid">
          {filteredBooks.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">📖</span>
              <h3>No books found</h3>
              <p>Try adjusting your search terms</p>
            </div>
          ) : (
            filteredBooks.map(book => (
              <CardComponent
                key={book._id}
                title={book.title}
                description={`by ${book.author}${book.pages ? ` • ${book.pages} pages` : ''} • PDF Format`}
                onDownload={() => handleDownload(book._id, book.title)}
                isDownloading={downloading === book._id}
              />
            ))
          )}
        </div>

        {/* Featured Section using CardComponent */}
       
      </main>
    </>
  );
}

// Navigation Component
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
          
          {/* Only show admin link if user is authenticated admin */}
          {isAdmin() && (
            <Link 
              to="/admin" 
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <span className="nav-link-icon">⚙️</span>
              لوحة تحكم الأدمن
            </Link>
          )}
          
          {/* Show login/logout based on auth status */}
          {user ? (
            <div className="nav-user">
              <span className="nav-welcome">👤 {user.username}</span>
              <button onClick={logout} className="nav-logout">
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              <span className="nav-link-icon">🔐</span>
             خاص بالأدمن
                          </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// Main App Component with Router and Auth
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navigation />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Library />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
          <footer className="footer">
            <p>&copy; 2025 Digital Library. Built with React & Express.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;