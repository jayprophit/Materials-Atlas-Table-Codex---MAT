import type {NavigationSource} from './source-navigation';

export type CitationFormat='plain'|'bibtex'|'ris';
export type SourceCitationExport={text:string;extension:'txt'|'bib'|'ris';mimeType:string;missingMetadata:string[]};
const absent=(value:unknown)=>value===null||value===undefined||value===''||(Array.isArray(value)&&value.length===0);
const text=(value:unknown):string|null=>typeof value==='string'&&value.trim()?value.trim():typeof value==='number'&&Number.isFinite(value)?String(value):null;
const inline=(value:string)=>value.replace(/[\r\n\u0000-\u001f\u007f]+/g,' ').trim();
function serialize(value:unknown):string{
 if(Array.isArray(value))return '['+value.map(serialize).join(', ')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,child])=>JSON.stringify(key)+': '+serialize(child)).join(', ')+'}';
 return JSON.stringify(value)??String(value);
}
const display=(value:unknown)=>text(value)??serialize(value);
const bibText=(value:string)=>inline(value).replace(/[\\{}%&#_$^~]/g,character=>({'\\':'\\textbackslash{}','{':'\\{','}':'\\}','%':'\\%','&':'\\&','#':'\\#','_':'\\_','$':'\\$','^':'\\textasciicircum{}','~':'\\textasciitilde{}'}[character]!));
// DOI and URL values retain their identifier characters; only BibTeX delimiters are escaped.
const bibIdentifier=(value:string)=>inline(value).replace(/[\\{}]/g,character=>({'\\':'\\textbackslash{}','{':'\\{','}':'\\}'}[character]!));
function registeredUrl(value:unknown):string|null{
 const candidate=text(value);if(!candidate||/[\u0000-\u0020\u007f\\]/.test(candidate))return null;
 try{const url=new URL(candidate);return ['http:','https:'].includes(url.protocol)?candidate:null}catch{return null}
}

/** Bibliographic formatting only: exact registry fields remain the source owner. */
export function formatSourceCitation(source:NavigationSource,format:CitationFormat):SourceCitationExport{
 const metadata=source.registry_metadata;
 const field=(name:string,fallback?:unknown)=>!absent(metadata[name])?metadata[name]:fallback;
 const titleValue=field('title',source.title),yearValue=field('year',source.year);
 const authorsValue=field('authors',field('author',source.authors));
 const authorValues=Array.isArray(authorsValue)?authorsValue:absent(authorsValue)?[]:[authorsValue];
 const authors=authorValues.filter((value):value is string=>typeof value==='string'&&value.trim().length>0).map(value=>value.trim());
 const title=text(titleValue),year=text(yearValue),doi=text(metadata.doi),url=registeredUrl(metadata.url);
 const license=field('license',metadata.licence),retrieved=metadata.retrieved;
 const datedRetrieval=Array.isArray(metadata.dated_extractions)&&metadata.dated_extractions.some(value=>value!==null&&typeof value==='object'&&!absent((value as Record<string,unknown>).retrieved));
 const missingMetadata=[!title?'title':null,!authors.length?'authors':null,!year?'year':null,!doi?'DOI':null,!url?'URL':null,absent(license)?'license':null,absent(retrieved)&&!datedRetrieval?'retrieval date':null].filter((value):value is string=>value!==null);
 const notes=[`MAT source ID: ${source.source_id}`];
 const note=(label:string,value:unknown)=>{if(!absent(value))notes.push(label+': '+display(value))};
 note('Registry aliases',metadata.source_aliases);
 if(!absent(authorsValue))note('Author metadata as registered',authorsValue);
 if(!absent(metadata.authors)&&!absent(metadata.author))note('Additional singular author metadata',metadata.author);
 for(const key of Object.keys(metadata).sort())if(/author|attribution/i.test(key)&&!['authors','author','attribution','author_note','author_uncertainty'].includes(key))note('Registry '+key,metadata[key]);
 if(!title&&!absent(titleValue))note('Unparsed title metadata',titleValue);
 if(!year&&!absent(yearValue))note('Unparsed year metadata',yearValue);
 if(!doi&&!absent(metadata.doi))note('Unparsed DOI metadata',metadata.doi);
 if(!url&&!absent(metadata.url))notes.push('Registry URL could not be exported as one safe HTTP(S) destination; inspect the exact registry metadata.');
 for(const [key,label]of [
  ['organization','Organization'],['source_type','Source type'],['published','Published metadata'],['certificate_issue','Certificate issue date'],
  ['publication','Publication metadata'],['publisher','Publisher'],['report','Report'],['article','Article'],
  ['version','Source version'],['edition','Edition'],['current_version','Current source version'],
  ['verification_status','Registry review'],['scope','Scope'],['scope_note','Scope note'],['review_note','Review note'],
  ['caution','Caution'],['source_locator','Source locator'],['local_path','Local source path'],['sha256','Source SHA-256'],['same_work_as','Same work as'],
  ['attribution','Attribution'],['author_note','Author note'],['author_uncertainty','Author uncertainty'],
  ['retrieved','Retrieval date'],['dated_extractions','Dated extractions'],['additional_retrieval','Additional retrieval'],
 ] as const)note(label,metadata[key]);
 note('License',license);
 if(!absent(metadata.license)&&!absent(metadata.licence))note('Additional licence metadata',metadata.licence);
 notes.push('Author names are preserved as registered; surname/initial order and author identity have not been inferred.');
 if(missingMetadata.length)notes.push('Metadata NOT-REPORTED or not scalar: '+missingMetadata.join(', '));

 let output:string;
 if(format==='plain'){
  const citation=(authors.length?authors.join('; '):'[Authors NOT-REPORTED]')+' ('+(year??'[Year NOT-REPORTED]')+'). '+(title??'[Title NOT-REPORTED]')+'.';
  const publication=[text(metadata.journal),text(metadata.volume)?'Volume '+text(metadata.volume):null,text(metadata.issue)?'Issue '+text(metadata.issue):null,text(metadata.pages??metadata.page)?'Pages '+text(metadata.pages??metadata.page):null].filter(Boolean).join(' · ');
  output=[citation,publication,doi?'DOI: '+doi:'',url?'URL: '+url:'',...notes].filter(Boolean).map(inline).join('\n')+'\n';
 }else if(format==='bibtex'){
  const fields:string[]=[];
  const add=(key:string,value:unknown,identifier=false)=>{const scalar=text(value);if(scalar)fields.push('  '+key+' = {'+(identifier?bibIdentifier(scalar):bibText(scalar))+'}')};
  // Each author is literal to preserve unparsed personal, corporate or attributed names.
  if(authors.length)fields.push('  author = {'+authors.map(author=>'{'+bibText(author)+'}').join(' and ')+'}');
  add('title',title);add('year',year);add('journal',metadata.journal);add('volume',metadata.volume);add('number',metadata.issue);add('pages',metadata.pages??metadata.page);
  add('publisher',metadata.publisher);add('edition',metadata.edition);add('doi',doi,true);add('url',url,true);
  add('note',notes.join('; '));
  output='@misc{'+source.source_id.replace(/[^A-Za-z0-9_:-]/g,'_')+',\n'+fields.join(',\n')+'\n}\n';
 }else{
  const fields=['TY  - GEN','ID  - '+inline(source.source_id)];
  const add=(tag:string,value:unknown)=>{const scalar=text(value);if(scalar)fields.push(tag+'  - '+inline(scalar))};
  authors.forEach(author=>add('AU',author));add('TI',title);add('PY',year);add('JO',metadata.journal);add('VL',metadata.volume);add('IS',metadata.issue);
  const pages=text(metadata.pages??metadata.page),range=pages?.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if(range){add('SP',range[1]);add('EP',range[2])}else if(pages)notes.push('Pages as registered: '+pages);
  add('PB',metadata.publisher);add('ET',metadata.edition);add('DO',doi);add('UR',url);notes.forEach(value=>add('N1',value));fields.push('ER  -');
  output=fields.join('\n')+'\n';
 }
 return {text:output,extension:format==='plain'?'txt':format==='bibtex'?'bib':'ris',mimeType:format==='ris'?'application/x-research-info-systems':format==='bibtex'?'application/x-bibtex':'text/plain;charset=utf-8',missingMetadata};
}

export function citationFilename(source:NavigationSource,format:CitationFormat):string{
 const extension=format==='plain'?'txt':format==='bibtex'?'bib':'ris';
 return source.source_id.replace(/[^A-Za-z0-9_-]/g,'_')+'-reference.'+extension;
}
