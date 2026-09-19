export const normaliseMetric = s => s.toLowerCase().replace(/ionization/g,'ionisation').replace(/magnetization/g,'magnetisation').replace(/[^a-z0-9]/g,'');

export function schemaItems(text) {
  const items=[]; let section=null, subsection='', fence=null;
  text.replace(/\r\n/g,'\n').split('\n').forEach((line,i)=>{
    const code=line.match(/^\s*(`{3,}|~{3,})/);
    if(code){if(!fence)fence=code[1][0];else if(fence===code[1][0])fence=null;return;}
    if(fence)return;
    const h=line.match(/^# (\d+)\. (.+)$/);
    if(h){section={number:Number(h[1]),title:h[2]};subsection='';return;}
    const sub=line.match(/^#{2,3} (.+)$/);if(sub){subsection=sub[1];return;}
    const bullet=line.match(/^- (.+?)[;.]*$/);
    if(section&&section.number>=2&&section.number<=30&&bullet){
      const label=bullet[1].replace(/[;.]$/,'');
      items.push({requirement_id:`US-${String(section.number).padStart(2,'0')}-${String(items.filter(x=>x.section===section.number).length+1).padStart(3,'0')}`,section:section.number,layer:section.title,subsection,label,line:i+1,key:normaliseMetric(label)});
    }
  });
  return items;
}

export function metricAvailability(v){
  if(v===null||v===undefined)return 'EXPLICIT-NULL';
  if(typeof v==='string'&&/^(UNKNOWN|NOT[- _](?:APPLICABLE|MEASURED|AVAILABLE|ESTABLISHED)|INSUFFICIENT[- _]DATA|PLANNED|PENDING)$/i.test(v.trim()))return 'EXPLICIT-STATUS';
  if(v&&typeof v==='object'&&!Array.isArray(v)){
    if(Object.hasOwn(v,'value'))return metricAvailability(v.value);
    if(Object.keys(v).every(k=>['status','note','notes'].includes(k)))return 'EXPLICIT-STATUS';
  }
  return 'CANDIDATE-NEEDS-REVIEW';
}
