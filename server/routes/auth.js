import express from 'express';

const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

// LOGIN ROUTE - Simple version for testing
router.post('/login', (req, res) => {
  try {
    console.log('Login request received');
    console.log('req.body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }

    // Simple hardcoded check for now (we'll make it secure later)
    if (username === 'admin' && password === 'admin123') {
      const userData = {
        id: 1,
        username: 'admin',
        role: 'admin',
        loginTime: new Date().toISOString()
      };

      res.json({
        success: true,
        user: userData,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

// MIDDLEWARE - Simple token verification (for future use)
export const verifyToken = (req, res, next) => {
  // For now, just check if user is in session/localStorage
  // Later we'll implement proper JWT verification
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }
  
  // Simple check for now - in real app this would verify JWT
  req.user = { role: 'admin' }; // Mock user for testing
  next();
};

// MIDDLEWARE - Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export default router;