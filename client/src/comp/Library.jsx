import { useEffect, useRef, useState } from "react";
import  LazyCardComponent from "./LazyCardComponent";
function Library() {
  const [books, setBooks] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadBooks(1); // Load first page
  }, []);

  const loadBooks = async (page = 1) => {
    try {
      setLoading(true);
      
      // Use pagination parameters - remove limit to get all books at once
      const response = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books?page=1&limit=5`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      // Handle the new response format
      if (data && data.books && Array.isArray(data.books)) {
        setBooks(data.books);
        setTotalBooks(data.total || data.books.length);
        setTotalPages(data.pages || 1);
        setCurrentPage(data.page || 1);
        console.log('✅ Books loaded successfully:', data.books.length);
      } else {
        console.error('❌ Unexpected response format:', data);
        setBooks([]);
      }
      
    } catch (err) {
      console.error('Error loading books:', err);
      setBooks([]);
      alert('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Keep your existing handleDownload function unchanged
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
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <span>{filteredBooks.length} of {totalBooks} books</span>
            ) : (
              <span> متاح إلى الآن   {totalBooks} كتابا</span>
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

export default Library;