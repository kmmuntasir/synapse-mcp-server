/**
 * A simple throttler for GitHub Search API (30 requests per minute).
 */
export class GitHubSearchThrottler {
    private lastRequests: number[] = [];
    private readonly LIMIT = 30;
    private readonly WINDOW = 60 * 1000; // 1 minute

    async waitIfNecessary(): Promise<void> {
        const now = Date.now();
        this.lastRequests = this.lastRequests.filter(time => now - time < this.WINDOW);

        if (this.lastRequests.length >= this.LIMIT) {
            const oldest = this.lastRequests[0];
            const waitTime = this.WINDOW - (now - oldest) + 500; // Add small buffer
            console.error(`GitHub Search rate limit approaching. Waiting ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.waitIfNecessary(); // Re-check after waiting
        }

        this.lastRequests.push(Date.now());
    }
}
