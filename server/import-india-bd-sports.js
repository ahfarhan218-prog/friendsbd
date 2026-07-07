const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/friends_bd').then(async () => {
  const Channel = require('./models/Channel');
  
  console.log('Fetching channels...');
  const channelsRes = await fetch('https://iptv-org.github.io/api/channels.json');
  const channelsData = await channelsRes.json();
  
  console.log('Fetching streams...');
  const streamsRes = await fetch('https://iptv-org.github.io/api/streams.json');
  const streamsData = await streamsRes.json();
  
  console.log('Processing...');
  
  let addedIN = 0;
  let addedBD = 0;
  let addedSports = 0;
  
  for (const ch of channelsData) {
    if (addedIN > 150 && addedBD > 100 && addedSports > 200) {
      break;
    }
    
    let shouldAdd = false;
    let addType = '';
    
    if (ch.country === 'BD' && addedBD <= 100) {
      shouldAdd = true;
      addType = 'BD';
    } else if (ch.country === 'IN' && addedIN <= 150) {
      shouldAdd = true;
      addType = 'IN';
    } else if (ch.categories && ch.categories.map(c=>c.toLowerCase()).includes('sports') && addedSports <= 200) {
      shouldAdd = true;
      addType = 'Sports';
    }
    
    if (shouldAdd) {
      // Find a stream for this channel
      const stream = streamsData.find(s => s.channel === ch.id);
      
      // If a stream exists, and it is not known to be offline
      if (stream && stream.status !== 'error' && stream.status !== 'offline') {
        const exists = await Channel.findOne({ channelId: ch.id });
        if (!exists) {
          try {
            const newChannel = new Channel({
              channelId: ch.id,
              name: ch.name,
              logoUrl: ch.logo || '',
              streamUrl: stream.url,
              category: ch.categories && ch.categories.length > 0 ? ch.categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)) : ['All'],
              language: ch.languages && ch.languages[0] ? ch.languages[0] : 'Unknown',
              country: ch.country || 'Global',
              status: 'active',
              isPremium: false
            });
            await newChannel.save();
            
            if (addType === 'BD') addedBD++;
            if (addType === 'IN') addedIN++;
            if (addType === 'Sports') addedSports++;
          } catch(err) {
            // ignore validation errors
          }
        }
      }
    }
  }
  
  const count = await Channel.countDocuments();
  console.log(`Successfully added:`);
  console.log(`- ${addedBD} BD Channels`);
  console.log(`- ${addedIN} India Channels`);
  console.log(`- ${addedSports} Global Sports Channels`);
  console.log('Total Channels now:', count);
  process.exit(0);
});
