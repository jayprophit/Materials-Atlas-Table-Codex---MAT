import {test,expect} from '@playwright/test';

test('frequency library displays canonical measurements, uncertainty and existing relationships',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.getByRole('button',{name:'Open frequency research library',exact:true}).click();
 const comparison=page.locator('.canonical-readings');
 await expect(comparison.getByRole('heading',{name:'Canonical readings and evidence'})).toBeVisible();
 await expect(comparison.locator('tbody tr')).toHaveCount(5);
 const experiment=comparison.locator('[data-reading-id="hydrogen-hyperfine-1970"]');
 await expect(experiment).toContainText('Atomic-Hydrogen hyperfine experiment (1970)');
 await expect(experiment).toContainText('1420405751.768 Hz');
 await expect(experiment).toContainText('±0.002 Hz');
 await expect(experiment.getByRole('cell',{name:'MEASURED',exact:true})).toBeVisible();
 await expect(experiment.getByRole('link',{name:/original source/})).toHaveAttribute('href','https://tf.nist.gov/general/pdf/13.pdf');
 await experiment.getByText('Conditions, provenance and limitations',{exact:true}).click();
 await expect(experiment).toContainText('printed p.207');
 await expect(experiment.getByRole('link',{name:'Canonical owner',exact:true})).toHaveAttribute('href','./records/0001-Hydrogen-H/experiments/0001-Hydrogen-H-Experiments.yaml');
 const master=comparison.locator('[data-reading-id="hydrogen-hyperfine-transition"]');
 await expect(master).toContainText('Ground-state hyperfine transition frequency');
 await expect(master.getByRole('cell',{name:'UNVERIFIED',exact:true})).toBeVisible();
 await expect(master.getByRole('cell',{name:/^UNKNOWN/})).toBeVisible();
 const relationships=comparison.getByRole('list',{name:'Canonical reading relationships'});
 await expect(relationships).toContainText('FORMS-MOLECULE');
 await expect(relationships).toContainText('MAT:0001:MOL:H2');
 await expect(relationships.getByRole('link',{name:'Relationship source'}).first()).toHaveAttribute('href',/records\/.+\/relationships\/.+\.yaml$/);
 await expect(comparison.getByRole('link',{name:/Explore Russell/})).toHaveAttribute('href','./docs/07-migration/Russell-1926-Primary-Source.md');
 await expect(page.locator('.frequency-results li').first()).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(comparison.getByRole('region',{name:/Canonical readings comparison/})).toHaveAttribute('tabindex','0');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 expect(errors).toEqual([]);
});

test('an HTML fallback for canonical reading data displays a useful error and preserves the publisher library',async({page})=>{
 await page.route('**/data/quality/mat-update-intake.json',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body>Publication fallback</body></html>'}));
 await page.goto('/');
 await page.getByRole('button',{name:'Open frequency research library',exact:true}).click();
 const comparison=page.locator('.canonical-readings');
 await expect(comparison.getByRole('alert')).toContainText('The server returned a page instead of canonical reading data.');
 await expect(comparison.getByRole('alert')).toContainText('The publisher reference library remains available below.');
 await expect(comparison.locator('tbody tr')).toHaveCount(0);
 await expect(page.getByPlaceholder('Name, substance, organism or source ID')).toBeVisible();
 await expect(page.locator('.frequency-results li').first()).toBeVisible();
});
