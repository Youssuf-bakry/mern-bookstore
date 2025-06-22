import { useState } from 'react';
import './BooksTable.css';

function BooksTable({ books, onDelete, onUpdate, showMessage }) {
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', pages: '' });

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
        onUpdate(); // Callback to refresh books list
      } else {
        try {
          const error = await response.json();
          showMessage('error', error.error || 'Update failed');
        } catch (parseError) {
          showMessage('error', `Update failed with status: ${response.status}`);
        }
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (books.length === 0) {
    return (
      <div className="no-books">
        <span className="no-books-icon">📚</span>
        <p>No books uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="books-table-container">
      <table className="books-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Pages</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map(book => (
            <tr key={book._id} className={editing === book._id ? 'editing-row' : ''}>
              {editing === book._id ? (
                // Edit mode
                <>
                  <td>
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditInputChange}
                      className="edit-input"
                      placeholder="Book title"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="author"
                      value={editForm.author}
                      onChange={handleEditInputChange}
                      className="edit-input"
                      placeholder="Author name"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="pages"
                      value={editForm.pages}
                      onChange={handleEditInputChange}
                      className="edit-input edit-input-small"
                      placeholder="Pages"
                      min="1"
                    />
                  </td>
                  <td>{formatDate(book.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="save-btn"
                        onClick={() => handleSaveEdit(book._id)}
                        title="Save changes"
                      >
                        Save
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={handleCancelEdit}
                        title="Cancel editing"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                // View mode
                <>
                  <td className="book-title">{book.title}</td>
                  <td className="book-author">{book.author}</td>
                  <td className="book-pages">{book.pages || 'N/A'}</td>
                  <td className="book-date">{formatDate(book.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(book)}
                        title="Edit book details"
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => onDelete(book._id, book.title)}
                        title="Delete book"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BooksTable;