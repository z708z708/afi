import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes

// GET Data
app.get('/api/data', async (req, res) => {
  try {
    const data = await prisma.appData.findUnique({
      where: { id: 1 }
    });
    
    if (!data) {
      return res.json({ profile: null, movies: [] });
    }

    res.json({
      profile: JSON.parse(data.profile),
      movies: JSON.parse(data.movies)
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// SAVE Data
app.post('/api/data', async (req, res) => {
  try {
    const { profile, movies } = req.body;

    const data = await prisma.appData.upsert({
      where: { id: 1 },
      update: {
        profile: JSON.stringify(profile),
        movies: JSON.stringify(movies)
      },
      create: {
        id: 1,
        profile: JSON.stringify(profile),
        movies: JSON.stringify(movies)
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Handle React Routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});