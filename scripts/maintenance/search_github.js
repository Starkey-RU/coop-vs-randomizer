const axios = require('axios');

async function search() {
    try {
        const { data } = await axios.get('https://api.github.com/search/repositories?q=helldivers+2+api+OR+assets+OR+data+OR+icons&sort=stars&order=desc', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        data.items.slice(0, 10).forEach(repo => {
            console.log(`- ${repo.name}: ${repo.html_url}`);
            console.log(`  ${repo.description}`);
        });
    } catch (e) {
        console.error(e.message);
    }
}

search();