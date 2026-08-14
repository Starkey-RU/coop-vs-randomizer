const axios = require('axios');
const fs = require('fs');

async function getHtml() {
    try {
        const url = 'https://helldivers.wiki.gg/wiki/Weapons';
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        fs.writeFileSync('weapons.html', data);
        console.log('Saved to weapons.html');
    } catch (e) {
        console.error(e);
    }
}

getHtml();