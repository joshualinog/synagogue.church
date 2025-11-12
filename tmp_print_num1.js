const fs=require('fs');
const j=JSON.parse(fs.readFileSync('data/bibles/leb.json','utf8'));
const n=j['Num']&&j['Num']['1'];
if(!n){console.error('Num 1 not found'); process.exit(1);} 
for(let i=1;i<=19;i++){ const v=n[String(i)]; console.log(String(i).padStart(2,' ')+': '+(v?v.replace(/\n/g,'\\n'):'[missing]')); }
