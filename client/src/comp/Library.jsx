import { useEffect, useState } from "react";
import LazyCardComponent from "./LazyCardComponent";

function Library() {
  const [books, setBooks] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 10; 
  useEffect(() => {
    fetchBooks(page);
    // eslint-disable-next-line
  }, [page]);

  const fetchBooks = async (pageNum) => {
    setLoading(true);
    try {
      const res = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books?page=${pageNum}&limit=${limit}`);
      const data = await res.json();
      if (pageNum === 1) {
        setBooks(data.books);
      } else {
        setBooks(prev => [...prev, ...data.books]);
      }
      setTotal(data.total);
      setHasMore(pageNum < data.pages);
    } catch (err) {
      console.error('Error loading books:', err);
      alert('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => setPage(prev => prev + 1);

  const handleDownload = async (bookId, title) => {
    if (downloading === bookId) return;
    try {
      setDownloading(bookId);
      const response = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books/${bookId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Downloaded file is empty');
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

  return (
    <>
      <header className="library-header">
        <h1>📚 مكتبة الكتب الرقمية</h1>
        <p>ابحث عن كتبك المفضلة أو تصفح أحدث الإضافات</p>
      </header>
      <section className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="ابحث باسم الكتاب أو المؤلف..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPage(1); 
          }}
        />
        <span className="search-count">
          {filteredBooks.length} / {total} كتاب
        </span>
      </section>
      <main className="main">
        <div className="books-grid">
          {filteredBooks.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">📖</span>
              <h3>لا توجد نتائج</h3>
              <p>جرّب تعديل كلمات البحث</p>
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
        {hasMore && !loading && (
          <button className="load-more-btn" onClick={handleLoadMore}>
            تحميل المزيد
          </button>
        )}
        {loading && <div className="loading-spinner"></div>}
      </main>
    </>
  );
}

export default Library;