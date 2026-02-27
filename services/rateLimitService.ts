/**
 * RateLimitService
 * Tracks image generation timestamps in localStorage to enforce client-side limits.
 */

const STORAGE_KEY = 'generation_history';

export const RateLimitService = {
    /**
     * Records a new generation event.
     * @param count Number of photos generated in this event.
     */
    recordGeneration(count: number = 1) {
        const history = this.getHistory();
        const now = Date.now();
        
        // Add a timestamp for each photo generated
        for (let i = 0; i < count; i++) {
            history.push(now);
        }
        
        // Keep only relevant history (within the limit window)
        const limitMinutes = Number(import.meta.env.VITE_LIMIT_MINUTES) || 5;
        const windowMs = limitMinutes * 60 * 1000;
        const filteredHistory = history.filter(ts => now - ts < windowMs);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
    },

    /**
     * Checks if the user has exceeded the generation limit.
     * @param requestedCount Number of photos the user wants to generate now.
     * @returns { allowed: boolean, remaining: number, resetInMinutes: number, resetAt: number }
     */
    checkLimit(requestedCount: number = 1) {
        const maxPhotos = Number(import.meta.env.VITE_MAX_PHOTOS) || 10;
        const limitMinutes = Number(import.meta.env.VITE_LIMIT_MINUTES) || 5;
        const windowMs = limitMinutes * 60 * 1000;
        const now = Date.now();
        
        const history = this.getHistory();
        const activeHistory = history.filter(ts => now - ts < windowMs);
        
        const currentCount = activeHistory.length;
        const allowed = (currentCount + requestedCount) <= maxPhotos;
        const remaining = Math.max(0, maxPhotos - currentCount);
        
        let resetInMinutes = 0;
        let resetAt = 0;
        if (!allowed && activeHistory.length > 0) {
            const oldestRelevant = activeHistory[0];
            const msUntilReset = windowMs - (now - oldestRelevant);
            resetInMinutes = Math.ceil(msUntilReset / (60 * 1000));
            resetAt = oldestRelevant + windowMs;
        }

        return {
            allowed,
            remaining,
            resetInMinutes,
            resetAt,
            maxPhotos,
            limitMinutes
        };
    },

    getHistory(): number[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
};
