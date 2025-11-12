const fs=require('fs');
const j=JSON.parse(fs.readFileSync('data/bibles/leb.json','utf8'));
const l=j['Luke']&&j['Luke']['1'];
if(!l){console.error('Luke 1 not found'); process.exit(1);} 
[13,14,15,16,17].forEach(i=>{ const v=l[String(i)]; console.log(String(i)+': '+(v?v.replace(/\n/g,'\\n'):'[missing]')) });
