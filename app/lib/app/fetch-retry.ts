// Data files (graph index, book data, units, evidence, samples) are static, so a failed request is
// almost always a dropped connection on a weak network. Retry those quietly before showing an error.
const RETRY_DELAYS_MS = [600, 1800];

/** fetch() that retries network failures and 5xx responses twice (0.6 s, then 1.8 s later). */
export async function fetchWithRetry(input: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.status < 500 || attempt >= RETRY_DELAYS_MS.length) return response;
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || (error instanceof DOMException && error.name === "AbortError")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
}
