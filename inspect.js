const axios = require('axios');
const cheerio = require('cheerio');

async function checkWiki() {
    try {
        const url = 'https://helldivers.wiki.gg/wiki/Weapons';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let sample = [];
        
        // Find tables
        $('table.wikitable').first().find('tr').slice(1, 4).each((i, el) => {
            const cols = $(el).find('th, td');
            if (cols.length > 0) {
                const name = $(cols[0]).text().trim();
                const imageEl = $(cols[1]).find('img');
                const imageSrc = imageEl.attr('src');
                const peneration = $(cols[2]).text().trim(); // Just checking structure
                
                sample.push({ name, imageSrc });
            }
        });
        
        console.log(JSON.stringify(sample, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkWiki();