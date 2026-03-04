require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Verify Gemini API key is set
const geminiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!geminiKey || geminiKey.length < 10) {
  console.warn('[Server] WARNING: GOOGLE_GEMINI_API_KEY not set or invalid in .env - AI features will fail');
} else {
  console.log('[Server] Gemini API key loaded');
}

const express = require('express');
const cors = require('cors');
const { connectUsersDB, connectConversationsDB, connectOperationsDB } = require('./utils/mongodb');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const formRoutes = require('./routes/forms');
const exportRoutes = require('./routes/exports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    /\.onrender\.com$/,
    /\.parahelper\.app$/
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/forms', formRoutes);
app.use('/api', exportRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ParaHelper Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

async function startServer() {
  try {
    console.log('\n========================================');
    console.log('   ParaHelper Backend Starting...');
    console.log('========================================\n');

    await connectUsersDB();
    await connectConversationsDB();
    await connectOperationsDB();
    console.log('[Server] All MongoDB databases connected\n');

    app.listen(PORT, () => {
      console.log(`[Server] ParaHelper backend running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
      console.log('\n========================================');
      console.log('   ParaHelper Ready for Deployment');
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
