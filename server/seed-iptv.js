const https = require('https');
const mongoose = require('mongoose');
const Channel = require('./models/Channel');

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/friends_bd');
    console.log('Fetching channels from iptv-org...');
    
    const [channels, streams] = await Promise.all([
      fetchJson('https://iptv-org.github.io/api/channels.json'),
      fetchJson('https://iptv-org.github.io/api/streams.json')
    ]);

    console.log(`Fetched ${channels.length} channels and ${streams.length} streams.`);

    // We only want some specific channels to not overload the DB
    const targetCountries = ['BD', 'IN'];
    const filteredChannels = channels.filter(c => {
      if (c.country === 'BD') return true; // Include all BD
      if (c.country === 'IN') return true; // Include all IN
      if (c.categories && (c.categories.includes('sports') || c.categories.includes('kids') || c.categories.includes('movies'))) return true;
      return false;
    });

    const newDocs = [];
    const streamMap = new Map();
    // Some channels have multiple streams. Let's just pick the first working one.
    for (const s of streams) {
      if (s.status !== 'offline' && !streamMap.has(s.channel)) {
        streamMap.set(s.channel, s);
      }
    }

    let addedCount = 0;
    for (const c of filteredChannels) {
      if (addedCount > 200) break; // Limit to 200 channels to keep UI fast
      
      const stream = streamMap.get(c.id);
      if (stream) {
        const categories = ['All'];
        if (c.country === 'BD') categories.push('BD');
        if (c.country === 'IN') categories.push('Hindi');
        if (c.categories && c.categories.includes('movies')) categories.push('Movies');
        if (c.categories && c.categories.includes('sports')) categories.push('Sports');
        if (c.categories && c.categories.includes('kids')) categories.push('Kids');
        if (c.categories && c.categories.includes('nature')) categories.push('Nature');
        
        newDocs.push({
          channelId: c.id,
          name: c.name,
          logoUrl: c.logo || `https://via.placeholder.com/150/1a1a2e/ffffff?text=${encodeURIComponent(c.name)}`,
          category: categories,
          isPremium: c.categories && c.categories.includes('premium') ? true : false,
          streamUrl: stream.url,
          status: 'active'
        });
        addedCount++;
      }
    }

    console.log(`Found ${newDocs.length} valid streams for selected channels.`);
    
    // Clear existing channels
    await Channel.deleteMany({});
    console.log('Cleared old channels.');
    
    // Insert new ones
    if (newDocs.length > 0) {
       await Channel.insertMany(newDocs);
       console.log('Successfully inserted new iptv-org channels.');
    } else {
       console.log('No valid streams found.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
