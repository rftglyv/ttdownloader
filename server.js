import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimiter from './middleware/rateLimiter.js';
import { downloadTikTokVideo } from './tiktok.js';
import fs from 'fs';
import path from 'path';

export const getVersion = () => {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
};

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(compression());
app.use(rateLimiter);
app.use(express.static('public'));
// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use((req, res, next) => {
    res.setHeader('x-rftglyv', 'Raffy was here');
    res.setHeader('x-version', getVersion());
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', { error: null });
});

// POST endpoint for downloading TikTok videos
app.post('/download', async (req, res) => {
    const { url } = req.body;

    console.log('Received request to download:', url); // Now it will log the correct URL

    if (!url) {
        return res.status(400).render('index', { error: 'URL is required', videoUrl: null });
    }

    try {
        const videoUrl = await downloadTikTokVideo(url);
        res.render('result', { videoUrl, error: null });
    } catch (error) {
        console.error('Error downloading video:', error);
        res.status(500).render('index', { error: 'Failed to process the request', videoUrl: null });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
