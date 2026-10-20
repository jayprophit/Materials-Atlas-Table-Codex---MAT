import {test,expect} from '@playwright/test';

test('Studio glossary reads the shared chapter and preserves editorial origins',async({page,request})=>{
 const response=await request.get('/data/publication/generated/publication-glossary.json');
 expect(response.ok()).toBeTruthy();expect(response.headers()['content-type']).toContain('json');
 const glossary=await response.json();expect(glossary.glossary).toHaveLength(33);
 const book=await (await request.get('/book/data/glossary.json')).json();expect(book).toEqual(glossary);
 await page.goto('/');
 await page.getByRole('button',{name:'Alphabetical glossary',exact:true}).click();
 const reader=page.getByRole('article',{name:'Live chapter preview'});
 await expect(reader).toContainText('Source review pending');
 await expect(reader).toContainText('MAT:TERM:000001');
 await expect(reader).toContainText('Retained wording');
 await expect(reader.getByRole('heading',{name:'Half-life',exact:true})).toBeVisible();
 await expect(reader.getByRole('link',{name:'Canonical terminology owner',exact:true})).toHaveAttribute('href',/data\/vocabularies\/glossary.json$/);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('public book tooltips use the canonical definition and keep the authored label',async({page,request})=>{
 const glossary=await (await request.get('/book/data/glossary.json')).json();
 const origin=glossary.glossary.find((term:{preferred_label:string})=>term.preferred_label==='Allotrope');
 const data=page.waitForResponse(response=>response.url().endsWith('/book/data/glossary.json'));
 await page.goto('/book/index.html#read/'+encodeURIComponent(glossary.chapter));
 await data;
 const skip=page.getByRole('button',{name:'Skip tour',exact:true});
 if(await skip.isVisible())await skip.click();
 await expect(page.locator('#page')).toContainText('MAT:TERM:000001');
 await page.locator('#page h2').filter({hasText:/^Allotrope$/}).hover();
 const tooltip=page.locator('.glossary-tooltip');
 await expect(tooltip).toBeVisible();await expect(tooltip).toHaveAttribute('data-term-id',origin.term_id);
 await expect(tooltip).toContainText(origin.definition);await expect(tooltip).toContainText('MAT editorial definition; source review pending.');
 await page.locator('#page h2').filter({hasText:/^Causali E$/}).hover();
 await expect(tooltip).toHaveAttribute('data-term-id','MAT:TERM:000004');
 await expect(tooltip).toContainText('Authored conceptual framework; source review pending.');
});
