// Updated App.jsx - Simple lazy loading without backend changes
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { AuthProvider, useAuth } from './comp/AuthContext';
import AdminPanel from './comp/AdminPanel';
import Login from './comp/Login';
import ProtectedRoute from './comp/ProtectedRoute';
import CardComponent from './comp/CardComponent';
import './App.css';

// Simple Lazy Card Component - no separate API calls needed
const LazyCardComponent = ({ book, onDownload, isDownloading }) => {
  const [cardRef, setCardRef] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible
          if (observerRef.current && cardRef) {
            observerRef.current.unobserve(cardRef);
          }
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start showing 100px before coming into view
      }
    );

    if (cardRef && observerRef.current) {
      observerRef.current.observe(cardRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [cardRef]);

  // Skeleton component
  const SkeletonCard = () => (
    <div className="card-container skeleton-card">
      <div className="card-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
      </div>
      <div className="card-button-container">
        <div className="skeleton-button"></div>
      </div>
    </div>
  );

  return (
    <div ref={setCardRef}>
      {isVisible ? (
        <CardComponent
          title={book.title}
          description={
            <>
              صنفه {book.author}
              <br />
              {book.pages && `${book.pages} صفحة`}
            </>
          }
          onDownload={onDownload}
          isDownloading={isDownloading}
        />
      ) : (
        <SkeletonCard />
      )}
    </div>
  );
};

// Library Component with Simple Lazy Loading
function Library() {
  const [books, setBooks] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Load all books at once (but render them lazily)
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

  // Keep your original handleDownload function (it was working!)
  const handleDownload = async (bookId, title) => {
    if (downloading === bookId) return;

    try {
      setDownloading(bookId);
      
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
          <p className="subtitle">مع درر مختارة من مصنفات علماءنا المعاصرين</p>
        </div>
      </header>

      <main className="main">
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="ابحث عن كتاب أو مؤلف..."
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
              <span> متاح إلى الآن   {books.length} كتابا</span>
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
              <LazyCardComponent
                key={book._id}
                book={book}
                onDownload={() => handleDownload(book._id, book.title)}
                isDownloading={downloading === book._id}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
}

// Rest of your components remain the same...
// Navigation Component (unchanged)
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
              خاص بالأدمن
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// Main App Component (unchanged)
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
            <p>
              &copy; تم تطوير هذا الموقع بواسطة يوسف بكري
              <a 
                href="https://www.linkedin.com/in/youssuf-bakry" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ marginRight: '8px', color: '#0077B5' }}
              >
                <svg 
                  width="23" 
                  height="23" 
                  viewBox="0 0 24 24" 
                  fill="WHITE"
                  style={{ verticalAlign: 'middle' }}
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;