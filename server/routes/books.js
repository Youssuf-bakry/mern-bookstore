// import express from 'express';
// import mongoose from 'mongoose';
// import Book from '../models/Book.js';
// import { GridFSBucket, ObjectId } from 'mongodb';
// import multer from 'multer';
// import { GridFSStorage } from 'multer-gridfs-storage';

// const router = express.Router();

// router.get('/', async (req, res) => {
//   const books = await Book.find().sort({ createdAt: -1 });
//   res.json(books);
// });

// router.get('/:id', async (req, res) => {
//   try {
//     console.log('Requested book ID:', req.params.id);
    
//     const book = await Book.findById(req.params.id);
//     if (!book) {
//       console.log('Book not found');
//       return res.status(404).send('Book not found');
//     }

//     if (!book.fileId) {
//       console.log('Book has no fileId');
//       return res.status(404).send('PDF file not found');
//     }

//     const client = mongoose.connection.getClient();
//     const db = client.db();
//     const bucket = new GridFSBucket(db, { bucketName: 'books' });
    
//     console.log('Looking for fileId:', book.fileId);

//     // Check if file exists
//     const fileDoc = await db.collection('books.files').findOne({ _id: book.fileId });
//     if (!fileDoc) {
//       console.log('File not found in GridFS');
//       return res.status(404).send('File not found in storage');
//     }
    
//     console.log('Found file:', fileDoc.filename, 'Size:', fileDoc.length);

//     // Buffer the entire file
//     const downloadStream = bucket.openDownloadStream(book.fileId);
//     const chunks = [];
    
//     downloadStream.on('data', (chunk) => {
//       chunks.push(chunk);
//       console.log('Received chunk:', chunk.length);
//     });
    
//     downloadStream.on('error', (error) => {
//       console.error('Download error:', error);
//       if (!res.headersSent) {
//         res.status(500).send('Download failed: ' + error.message);
//       }
//     });
    
//     downloadStream.on('end', () => {
//       const buffer = Buffer.concat(chunks);
//       console.log('Total buffer size:', buffer.length);
      
//       if (buffer.length === 0) {
//         console.log('ERROR: Buffer is empty!');
//         return res.status(500).send('File is empty');
//       }
      
//       res.set({
//         'Content-Type': 'application/pdf',
//         'Content-Length': buffer.length.toString(),
//         'Content-Disposition': `attachment; filename="${encodeURIComponent(fileDoc.filename)}"`,
//       });
      
//       res.send(buffer);
//       console.log('File sent successfully');
//     });
    
//   } catch (err) {
//     console.error('Server error:', err);
//     if (!res.headersSent) {
//       res.status(500).send('Server error: ' + err.message);
//     }
//   }
// });

// export default router;

import express from 'express';
import mongoose from 'mongoose';
import Book from '../models/Book.js';
import { GridFSBucket, ObjectId } from 'mongodb';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Upload new book
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { title, author, pages } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }

    // Get MongoDB connection
    const client = mongoose.connection.getClient();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'books' });

    // Create upload stream
    const filename = `${Date.now()}-${req.file.originalname}`;
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        uploadedBy: 'admin',
        uploadDate: new Date(),
        originalName: req.file.originalname
      }
    });

    // Upload the file buffer to GridFS
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      try {
        // Create book record with the GridFS file ID
        const book = new Book({
          title: title.trim(),
          author: author.trim(),
          pages: pages ? parseInt(pages) : undefined,
          fileId: uploadStream.id,
          md5: uploadStream.md5
        });

        await book.save();
        console.log('Book saved:', book);

        res.status(201).json({
          message: 'Book uploaded successfully',
          book: book
        });
      } catch (saveError) {
        console.error('Error saving book:', saveError);
        res.status(500).json({ error: 'Failed to save book record' });
      }
    });

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({ error: 'Failed to upload file to storage' });
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload book: ' + err.message });
  }
});

// Delete book
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Delete file from GridFS
    const client = mongoose.connection.getClient();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'books' });
    
    try {
      await bucket.delete(book.fileId);
    } catch (gridfsError) {
      console.log('GridFS file not found or already deleted:', gridfsError.message);
    }

    // Delete book record
    await Book.findByIdAndDelete(req.params.id);

    res.json({ message: 'Book deleted successfully' });

  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete book: ' + err.message });
  }
});

// Download book (existing functionality)
router.get('/:id', async (req, res) => {
  try {
    console.log('Requested book ID:', req.params.id);
    
    const book = await Book.findById(req.params.id);
    if (!book) {
      console.log('Book not found');
      return res.status(404).send('Book not found');
    }

    if (!book.fileId) {
      console.log('Book has no fileId');
      return res.status(404).send('PDF file not found');
    }

    const client = mongoose.connection.getClient();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'books' });
    
    console.log('Looking for fileId:', book.fileId);

    // Check if file exists
    const fileDoc = await db.collection('books.files').findOne({ _id: book.fileId });
    if (!fileDoc) {
      console.log('File not found in GridFS');
      return res.status(404).send('File not found in storage');
    }
    
    console.log('Found file:', fileDoc.filename, 'Size:', fileDoc.length);

    // Buffer the entire file
    const downloadStream = bucket.openDownloadStream(book.fileId);
    const chunks = [];
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
      console.log('Received chunk:', chunk.length);
    });
    
    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).send('Download failed: ' + error.message);
      }
    });
    
    downloadStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log('Total buffer size:', buffer.length);
      
      if (buffer.length === 0) {
        console.log('ERROR: Buffer is empty!');
        return res.status(500).send('File is empty');
      }
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileDoc.filename)}"`,
      });
      
      res.send(buffer);
      console.log('File sent successfully');
    });
    
  } catch (err) {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.status(500).send('Server error: ' + err.message);
    }
  }
});

export default router;