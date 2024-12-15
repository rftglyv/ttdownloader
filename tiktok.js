import { TTScraper } from "tiktok-scraper-ts"; // Individual classes

/**
 * Downloads TikTok video using tiktok-scraper.
 * @param {string} videoUrl - The TikTok video URL.
 * @returns {Promise<string>} - The direct video download URL.
 */
export async function tiktokScraperDownload(videoUrl) {
    try {
        // Fetch the video metadata using tiktok-scraper
        const scrapper = new TTScraper();
        const link = await scrapper.noWaterMark(videoUrl);

        if (!link) {
            throw new Error('Video download URL not found');
        }

        return link;
    } catch (error) {
        console.error('tiktok-scraper error:', error);
        throw new Error('Failed to extract video URL from tiktok-scraper');
    }
}

/**
 * Main download function that uses tiktok-scraper.
 * @param {string} url - The TikTok video URL.
 * @returns {Promise<string>} - The final video download URL.
 */
export async function downloadTikTokVideo(url) {
    try {
        // Attempt download with tiktok-scraper
        const videoUrl = await tiktokScraperDownload(url);
        return videoUrl;
    } catch (error) {
        console.error('Error downloading video:', error);
        throw new Error('Failed to extract video URL');
    }
}
