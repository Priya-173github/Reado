const cache: Record<string, any[]> = {};

let controller: AbortController | null = null;

export const searchBooks = async (query: string) => {

    const normalized = query.trim().toLowerCase();

    if (cache[normalized]) {
        return cache[normalized];
    }

    controller?.abort();

    controller = new AbortController();

    const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(normalized)}&limit=10`,
        {
            signal: controller.signal,
        }
    );

    if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    const books = (data.docs || []).map((item: any) => ({
        id: item.key,
        title: item.title,
        author: item.author_name?.[0] || 'Unknown Author',
        pages: item.number_of_pages_median || 0,
        cover: item.cover_i
            ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
            : null,
    }));

    cache[normalized] = books;

    return books;
};