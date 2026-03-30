const fs = require('fs');
const files = fs.readdirSync('JSON examples').filter(f => f.endsWith('.json'));

for (const file of files) {
  try {
    const raw = fs.readFileSync('JSON examples/' + file, 'utf8');
    const d = JSON.parse(raw);
    const sideMap = {};
    d.players.forEach(p => { sideMap[p.playerUID] = p.side; });
    
    if (d.kills) {
      const darkMemeDeaths = d.kills.filter(k => k.victim === '76561198047347949');
      if (darkMemeDeaths.length > 0) {
        console.log("-----");
        console.log("File:", file);
        darkMemeDeaths.forEach(k => {
            console.log("Death:", k);
            console.log("Victim Side:", sideMap[k.victim]);
            console.log("Killer Side:", sideMap[k.killer]);
        });
      }
    }
  } catch(e) {
    console.error("Error in " + file, e.message);
  }
}
