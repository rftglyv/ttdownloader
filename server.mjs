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
import fetch from 'node-fetch';
import { nanoid } from 'nanoid';

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

app.get('/download', (req, res) => {
    res.redirect('/');
});

// POST endpoint for downloading TikTok videos
app.post('/download', async (req, res) => {
    const { url } = req.body;

    console.log('Received request to download:', url);

    if (!url) {
        return res.status(400).render('index', { error: 'URL is required', videoUrl: null });
    }

    try {
        const videoUrl = await downloadTikTokVideo(url);

        if (!videoUrl) {
            console.log('No video URL returned for:', url);
            return res.redirect('/?error=No video found');
        }

        res.render('result', {
            videoUrl,
            error: null,
            originalUrl: url
        });
    } catch (error) {
        console.error('Error downloading video:', error);
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : 'Failed to process the request';
        res.status(500).render('index', { error: errorMessage, videoUrl: null });
    }
});

// New endpoint for handling actual file download
app.get('/download-video', async (req, res) => {
    const { videoUrl } = req.query;

    if (!videoUrl) {
        return res.status(400).send('Video URL is required');
    }

    try {
        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(videoUrl, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the content type from response, fallback to video/mp4 if not available
            const contentType = response.headers.get('content-type') || 'video/mp4';
            
            // Determine file extension from content type
            const ext = contentType.includes('webm') ? 'webm' : 
                       contentType.includes('quicktime') ? 'mov' :
                       'mp4';

            // Set headers to force download
            res.setHeader('Content-Disposition', `attachment; filename="${nanoid(10) + '.' + ext}"`);
            res.setHeader('Content-Type', contentType);

            response.body.pipe(res);
        } finally {
            clearTimeout(timeout);
        }
    } catch (error) {
        console.error('Error downloading video:', error);
        if (error.name === 'AbortError') {
            res.status(504).send('Download timeout');
        } else {
            res.status(500).send('Failed to download video');
        }
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
