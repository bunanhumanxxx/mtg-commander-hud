const SCRYFALL_API_BASE = 'https://api.scryfall.com';

export const ScryfallAPI = {
    async searchCards(query) {
        if (!query || query.trim().length === 0) return [];

        let searchQuery = query;
        if (query.trim().length === 1) {
            // Force exact match for single character queries (e.g., "山", "島")
            searchQuery = `!"${query}"`;
        }

        try {
            // Fetch prints (including multilingual) to ensure we get specific JP logic
            const response = await fetch(`${SCRYFALL_API_BASE}/cards/search?q=${encodeURIComponent(searchQuery)}%20(lang:ja%20or%20lang:en)&unique=prints&include_multilingual=true`);
            const data = await response.json();

            if (data.object === 'error') {
                return [];
            }

            // Prioritize Japanese cards, then by default order (relevance)
            const cards = data.data.sort((a, b) => {
                if (a.lang === 'ja' && b.lang !== 'ja') return -1;
                if (a.lang !== 'ja' && b.lang === 'ja') return 1;
                return 0;
            });

            // Convert back to array
            return cards.slice(0, 50).map(card => {
                let imageUrl = '';
                if (card.image_uris) {
                    imageUrl = card.image_uris.normal;
                } else if (card.card_faces) {
                    imageUrl = card.card_faces[0].image_uris?.normal;
                }

                let text = card.printed_text || card.oracle_text;
                let type = card.printed_type_line || card.type_line;
                let originalType = card.type_line;

                if (!text && card.card_faces) {
                    text = card.card_faces[0].printed_text || card.card_faces[0].oracle_text;
                }
                if (!type && card.card_faces) {
                    type = card.card_faces[0].printed_type_line || card.card_faces[0].type_line;
                }
                if (!originalType && card.card_faces) {
                    originalType = card.card_faces[0].type_line;
                }

                return {
                    id: card.id,
                    name: card.printed_name || card.name,
                    original_name: card.name,
                    set_name: card.set_name,
                    set: card.set.toUpperCase(),
                    collector_number: card.collector_number,
                    lang: card.lang,
                    mana_cost: card.mana_cost,
                    type_line: type,
                    original_type_line: originalType,
                    printed_type_line: card.printed_type_line,
                    oracle_text: text,
                    image_url: imageUrl,
                    is_partner: card.keywords && card.keywords.includes('Partner'),
                    cmc: card.cmc,
                    power: card.power,
                    toughness: card.toughness,
                    card_faces: card.card_faces
                };
            });
        } catch (e) {
            console.error('API Fetch Error:', e);
            return [];
        }
    },

    async getCardByName(name, lang = 'ja') {
        // Precise search
        try {
            const response = await fetch(`${SCRYFALL_API_BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`);
            const data = await response.json();
            if (data.object === 'error') return null;

            let imageUrl = data.image_uris?.normal;
            if (!imageUrl && data.card_faces) imageUrl = data.card_faces[0].image_uris?.normal;

            return {
                id: data.id,
                name: data.name,
                image_url: imageUrl,
                cmc: data.cmc
            };
        } catch (e) {
            return null;
        }
    }
};
