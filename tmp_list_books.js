const fs=require('fs');const j=JSON.parse(fs.readFileSync('data/bibles/leb.json','utf8')); console.log(Object.keys(j).slice(0,40));
