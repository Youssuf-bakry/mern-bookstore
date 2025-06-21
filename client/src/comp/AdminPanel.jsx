import { useState, useEffect } from 'react';
import './AdminPanel.css';

function AdminPanel() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null); // Track which book is being edited
  const [editForm, setEditForm] = useState({ title: '', author: '', pages: '' }); // Edit form data
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    pages: '',
    pdf: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('https://mern-bookstore-backend-amt0.onrender.com/api/books');
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      console.error('Error fetching books:', err);
      showMessage('error', 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      // Extract filename without extension
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove .pdf extension
      
      setFormData(prev => ({
        ...prev,
        pdf: file,
        title: fileName // Auto-populate title with filename
      }));
      showMessage('success', `Selected: ${file.name}`);
    } else {
      showMessage('error', 'Please select a valid PDF file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        // Extract filename without extension
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove .pdf extension
        
        setFormData(prev => ({
          ...prev,
          pdf: file,
          title: fileName // Auto-populate title with filename
        }));
        showMessage('success', `Selected: ${file.name}`);
      } else {
        showMessage('error', 'Please drop a valid PDF file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.pdf) {
      showMessage('error', 'Please fill in all required fields and select a PDF');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('author', formData.author);
      data.append('pages', formData.pages);
      data.append('pdf', formData.pdf);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          showMessage('success', 'Book uploaded successfully!');
          setFormData({ title: '', author: '', pages: '', pdf: null });
          fetchBooks(); // Refresh the books list
        } else {
          const error = JSON.parse(xhr.responseText);
          showMessage('error', error.error || 'Upload failed');
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        showMessage('error', 'Upload failed - network error');
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', 'https://mern-bookstore-backend-amt0.onrender.com/api/books/upload');
      
      // Remove any authorization header for now
      xhr.send(data);

    } catch (err) {
      console.error('Upload error:', err);
      showMessage('error', 'Upload failed: ' + err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (book) => {
    setEditing(book._id);
    setEditForm({
      title: book.title,
      author: book.author,
      pages: book.pages || ''
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditForm({ title: '', author: '', pages: '' });
  };

  const handleSaveEdit = async (bookId) => {
    try {
      const response = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          author: editForm.author.trim(),
          pages: editForm.pages ? parseInt(editForm.pages) : undefined
        })
      });

      if (response.ok) {
        showMessage('success', 'Book updated successfully');
        setEditing(null);
        setEditForm({ title: '', author: '', pages: '' });
        fetchBooks(); // Refresh the books list
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      showMessage('error', 'Update failed: ' + err.message);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (bookId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books/${bookId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('success', 'Book deleted successfully');
        fetchBooks(); // Refresh the books list
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showMessage('error', 'Delete failed: ' + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>📚 Admin Panel</h1>
        <p>Manage your digital library</p>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-content">
        {/* Upload Section */}
        <section className="upload-section">
          <h2>Upload New Book</h2>
          
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Book Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter book title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="author">Author *</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Enter author name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pages">Number of Pages</label>
                <input
                  type="number"
                  id="pages"
                  name="pages"
                  value={formData.pages}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>PDF File *</label>
              <div 
                className={`file-drop-zone ${dragActive ? 'active' : ''} ${formData.pdf ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="file-input"
                  id="pdf-input"
                />
                <label htmlFor="pdf-input" className="file-input-label">
                  {formData.pdf ? (
                    <div className="file-selected">
                      <span className="file-icon">📄</span>
                      <div className="file-info">
                        <div className="file-name">{formData.pdf.name}</div>
                        <div className="file-size">{formatFileSize(formData.pdf.size)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <span className="upload-icon">📤</span>
                      <div>
                        <div>Drag and drop your PDF here</div>
                        <div>or click to browse</div>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}

            <button 
              type="submit" 
              className="upload-btn"
              disabled={uploading || !formData.title || !formData.author || !formData.pdf}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Upload Book
                </>
              )}
            </button>
          </form>
        </section>

        {/* Books List Section */}
        <section className="books-section">
          <h2>Manage Books ({books.length})</h2>
          
          {loading ? (
            <div className="loading">Loading books...</div>
          ) : books.length === 0 ? (
            <div className="no-books">
              <span className="no-books-icon">📚</span>
              <p>No books uploaded yet</p>
            </div>
          ) : (
            <div className="books-table">
              <div className="table-header">
                <div>Title</div>
                <div>Author</div>
                <div>Pages</div>
                <div>Uploaded</div>
                <div>Actions</div>
              </div>
              {books.map(book => (
                <div key={book._id} className="table-row">
                  {editing === book._id ? (
                    // Edit mode
                    <>
                      <div className="book-title">
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditInputChange}
                          className="edit-input"
                          placeholder="Book title"
                        />
                      </div>
                      <div className="book-author">
                        <input
                          type="text"
                          name="author"
                          value={editForm.author}
                          onChange={handleEditInputChange}
                          className="edit-input"
                          placeholder="Author name"
                        />
                      </div>
                      <div className="book-pages">
                        <input
                          type="number"
                          name="pages"
                          value={editForm.pages}
                          onChange={handleEditInputChange}
                          className="edit-input edit-input-small"
                          placeholder="Pages"
                          min="1"
                        />
                      </div>
                      <div className="book-date">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </div>
                      <div className="book-actions">
                        <button 
                          className="save-btn"
                          onClick={() => handleSaveEdit(book._id)}
                          title="Save changes"
                        >
                          ✅
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={handleCancelEdit}
                          title="Cancel editing"
                        >
                          ❌
                        </button>
                      </div>
                    </>
                  ) : (
                    // View mode
                    <>
                      <div className="book-title">{book.title}</div>
                      <div className="book-author">{book.author}</div>
                      <div className="book-pages">{book.pages || 'N/A'}</div>
                      <div className="book-date">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </div>
                      <div className="book-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(book)}
                          title="Edit book"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(book._id, book.title)}
                          title="Delete book"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminPanel;

// import { useState, useEffect } from 'react';
// import './AdminPanel.css';

// function AdminPanel() {
//   const [books, setBooks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const [editing, setEditing] = useState(null); // Track which book is being edited
//   const [editForm, setEditForm] = useState({ title: '', author: '', pages: '' }); // Edit form data
//   const [formData, setFormData] = useState({
//     title: '',
//     author: '',
//     pages: '',
//     pdf: null
//   });
//   const [dragActive, setDragActive] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [message, setMessage] = useState({ type: '', text: '' });

//   useEffect(() => {
//     fetchBooks();
//   }, []);

//   const fetchBooks = async () => {
//     try {
//       const response = await fetch('https://mern-bookstore-backend-amt0.onrender.com/api/books');
//       const data = await response.json();
//       setBooks(data);
//     } catch (err) {
//       console.error('Error fetching books:', err);
//       showMessage('error', 'Failed to load books');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showMessage = (type, text) => {
//     setMessage({ type, text });
//     setTimeout(() => setMessage({ type: '', text: '' }), 5000);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file && file.type === 'application/pdf') {
//       // Extract filename without extension
//       const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove .pdf extension
      
//       setFormData(prev => ({
//         ...prev,
//         pdf: file,
//         title: fileName // Auto-populate title with filename
//       }));
//       showMessage('success', `Selected: ${file.name}`);
//     } else {
//       showMessage('error', 'Please select a valid PDF file');
//     }
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === 'dragenter' || e.type === 'dragover') {
//       setDragActive(true);
//     } else if (e.type === 'dragleave') {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     const files = e.dataTransfer.files;
//     if (files && files[0]) {
//       const file = files[0];
//       if (file.type === 'application/pdf') {
//         // Extract filename without extension
//         const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove .pdf extension
        
//         setFormData(prev => ({
//           ...prev,
//           pdf: file,
//           title: fileName // Auto-populate title with filename
//         }));
//         showMessage('success', `Selected: ${file.name}`);
//       } else {
//         showMessage('error', 'Please drop a valid PDF file');
//       }
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData.title || !formData.author || !formData.pdf) {
//       showMessage('error', 'Please fill in all required fields and select a PDF');
//       return;
//     }

//     setUploading(true);
//     setUploadProgress(0);

//     try {
//       const data = new FormData();
//       data.append('title', formData.title);
//       data.append('author', formData.author);
//       data.append('pages', formData.pages);
//       data.append('pdf', formData.pdf);

//       const xhr = new XMLHttpRequest();
      
//       xhr.upload.addEventListener('progress', (e) => {
//         if (e.lengthComputable) {
//           const progress = Math.round((e.loaded / e.total) * 100);
//           setUploadProgress(progress);
//         }
//       });

//       xhr.addEventListener('load', () => {
//         if (xhr.status === 201) {
//           const response = JSON.parse(xhr.responseText);
//           showMessage('success', 'Book uploaded successfully!');
//           setFormData({ title: '', author: '', pages: '', pdf: null });
//           fetchBooks(); // Refresh the books list
//         } else {
//           const error = JSON.parse(xhr.responseText);
//           showMessage('error', error.error || 'Upload failed');
//         }
//         setUploading(false);
//         setUploadProgress(0);
//       });

//       xhr.addEventListener('error', () => {
//         showMessage('error', 'Upload failed - network error');
//         setUploading(false);
//         setUploadProgress(0);
//       });

//       xhr.open('POST', 'https://mern-bookstore-backend-amt0.onrender.com/api/books/upload');
      
//       // Remove any authorization header for now
//       xhr.send(data);

//     } catch (err) {
//       console.error('Upload error:', err);
//       showMessage('error', 'Upload failed: ' + err.message);
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const handleEdit = (book) => {
//     setEditing(book._id);
//     setEditForm({
//       title: book.title,
//       author: book.author,
//       pages: book.pages || ''
//     });
//   };

//   const handleCancelEdit = () => {
//     setEditing(null);
//     setEditForm({ title: '', author: '', pages: '' });
//   };

//   const handleSaveEdit = async (bookId) => {
//     try {
//       const response = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books/${bookId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           title: editForm.title.trim(),
//           author: editForm.author.trim(),
//           pages: editForm.pages ? parseInt(editForm.pages) : undefined
//         })
//       });

//       if (response.ok) {
//         showMessage('success', 'Book updated successfully');
//         setEditing(null);
//         setEditForm({ title: '', author: '', pages: '' });
//         fetchBooks(); // Refresh the books list
//       } else {
//         const error = await response.json();
//         showMessage('error', error.error || 'Update failed');
//       }
//     } catch (err) {
//       console.error('Update error:', err);
//       showMessage('error', 'Update failed: ' + err.message);
//     }
//   };

//   const handleEditInputChange = (e) => {
//     const { name, value } = e.target;
//     setEditForm(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleDelete = async (bookId, title) => {
//     if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
//       return;
//     }

//     try {
//       const response = await fetch(`https://mern-bookstore-backend-amt0.onrender.com/api/books/${bookId}`, {
//         method: 'DELETE'
//       });

//       if (response.ok) {
//         showMessage('success', 'Book deleted successfully');
//         fetchBooks(); // Refresh the books list
//       } else {
//         const error = await response.json();
//         showMessage('error', error.error || 'Delete failed');
//       }
//     } catch (err) {
//       console.error('Delete error:', err);
//       showMessage('error', 'Delete failed: ' + err.message);
//     }
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   return (
//     <div className="admin-panel">
//       <header className="admin-header">
//         <h1>📚 Admin Panel</h1>
//         <p>Manage your digital library</p>
//       </header>

//       {message.text && (
//         <div className={`message ${message.type}`}>
//           {message.text}
//         </div>
//       )}

//       <div className="admin-content">
//         {/* Upload Section */}
//         <section className="upload-section">
//           <h2>Upload New Book</h2>
          
//           <form onSubmit={handleSubmit} className="upload-form">
//             <div className="form-row">
//               <div className="form-group">
//                 <label htmlFor="title">Book Title *</label>
//                 <input
//                   type="text"
//                   id="title"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   placeholder="Enter book title"
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="author">Author *</label>
//                 <input
//                   type="text"
//                   id="author"
//                   name="author"
//                   value={formData.author}
//                   onChange={handleInputChange}
//                   placeholder="Enter author name"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="form-row">
//               <div className="form-group">
//                 <label htmlFor="pages">Number of Pages</label>
//                 <input
//                   type="number"
//                   id="pages"
//                   name="pages"
//                   value={formData.pages}
//                   onChange={handleInputChange}
//                   placeholder="Optional"
//                   min="1"
//                 />
//               </div>
//             </div>

//             <div className="form-group">
//               <label>PDF File *</label>
//               <div 
//                 className={`file-drop-zone ${dragActive ? 'active' : ''} ${formData.pdf ? 'has-file' : ''}`}
//                 onDragEnter={handleDrag}
//                 onDragLeave={handleDrag}
//                 onDragOver={handleDrag}
//                 onDrop={handleDrop}
//               >
//                 <input
//                   type="file"
//                   accept="application/pdf"
//                   onChange={handleFileChange}
//                   className="file-input"
//                   id="pdf-input"
//                 />
//                 <label htmlFor="pdf-input" className="file-input-label">
//                   {formData.pdf ? (
//                     <div className="file-selected">
//                       <span className="file-icon">📄</span>
//                       <div className="file-info">
//                         <div className="file-name">{formData.pdf.name}</div>
//                         <div className="file-size">{formatFileSize(formData.pdf.size)}</div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="file-placeholder">
//                       <span className="upload-icon">📤</span>
//                       <div>
//                         <div>Drag and drop your PDF here</div>
//                         <div>or click to browse</div>
//                       </div>
//                     </div>
//                   )}
//                 </label>
//               </div>
//             </div>

//             {uploading && (
//               <div className="upload-progress">
//                 <div className="progress-bar">
//                   <div 
//                     className="progress-fill" 
//                     style={{ width: `${uploadProgress}%` }}
//                   ></div>
//                 </div>
//                 <span className="progress-text">{uploadProgress}%</span>
//               </div>
//             )}

//             <button 
//               type="submit" 
//               className="upload-btn"
//               disabled={uploading || !formData.title || !formData.author || !formData.pdf}
//             >
//               {uploading ? (
//                 <>
//                   <span className="spinner"></span>
//                   Uploading...
//                 </>
//               ) : (
//                 <>
//                   <span>📤</span>
//                   Upload Book
//                 </>
//               )}
//             </button>
//           </form>
//         </section>

//         {/* Books List Section */}
//         <section className="books-section">
//           <h2>Manage Books ({books.length})</h2>
          
//           {loading ? (
//             <div className="loading">Loading books...</div>
//           ) : books.length === 0 ? (
//             <div className="no-books">
//               <span className="no-books-icon">📚</span>
//               <p>No books uploaded yet</p>
//             </div>
//           ) : (
//             <div className="books-table">
//               <div className="table-header">
//                 <div>Title</div>
//                 <div>Author</div>
//                 <div>Pages</div>
//                 <div>Uploaded</div>
//                 <div>Actions</div>
//               </div>
//               {books.map(book => (
//                 <div key={book._id} className="table-row">
//                   {editing === book._id ? (
    
//                     <>
//                       <div className="book-title">
//                         <input
//                           type="text"
//                           name="title"
//                           value={editForm.title}
//                           onChange={handleEditInputChange}
//                           className="edit-input"
//                           placeholder="Book title"
//                         />
//                       </div>
//                       <div className="book-author">
//                         <input
//                           type="text"
//                           name="author"
//                           value={editForm.author}
//                           onChange={handleEditInputChange}
//                           className="edit-input"
//                           placeholder="Author name"
//                         />
//                       </div>
//                       <div className="book-pages">
//                         <input
//                           type="number"
//                           name="pages"
//                           value={editForm.pages}
//                           onChange={handleEditInputChange}
//                           className="edit-input edit-input-small"
//                           placeholder="Pages"
//                           min="1"
//                         />
//                       </div>
//                       <div className="book-date">
//                         {new Date(book.createdAt).toLocaleDateString()}
//                       </div>
//                       <div className="book-actions">
//                         <button 
//                           className="save-btn"
//                           onClick={() => handleSaveEdit(book._id)}
//                           title="Save changes"
//                         >
//                           ✅
//                         </button>
//                         <button 
//                           className="cancel-btn"
//                           onClick={handleCancelEdit}
//                           title="Cancel editing"
//                         >
//                           ❌
//                         </button>
//                       </div>
//                     </>
//                   ) : (
                
//                     <>
//                       <div className="book-title">{book.title}</div>
//                       <div className="book-author">{book.author}</div>
//                       <div className="book-pages">{book.pages || 'N/A'}</div>
//                       <div className="book-date">
//                         {new Date(book.createdAt).toLocaleDateString()}
//                       </div>
//                       <div className="book-actions">
//                         <button 
//                           className="edit-btn"
//                           onClick={() => handleEdit(book)}
//                           title="Edit book"
//                         >
//                           ✏️ Edit
//                         </button>
//                         <button 
//                           className="delete-btn"
//                           onClick={() => handleDelete(book._id, book.title)}
//                           title="Delete book"
//                         >
//                           🗑️ Delete
//                         </button>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>
//     </div>
//   );
// }

// export default AdminPanel;

