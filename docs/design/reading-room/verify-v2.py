import json
from pathlib import Path
BASE='http://127.0.0.1:4321'
OUT=Path('/home/sharziki/Projects/purdue-founder-map/docs/design/reading-room')
errors=[]
page.on('pageerror',lambda e:errors.append(str(e)))
page.set_viewport_size({'width':1440,'height':900})
page.goto(BASE+'/library',wait_until='networkidle')
page.wait_for_function("document.querySelectorAll('.spine-btn').length===26")
assert page.locator('#room-sub').inner_text().startswith('2,130')
page.locator('#q').fill('Peters')
page.wait_for_timeout(200)
assert page.locator('#results-list li').count()>0
page.locator('#q').fill('Jeffrey Peters')
page.locator('#q').press('Enter')
page.wait_for_function("document.querySelector('#book').classList.contains('ready')")
page.wait_for_function("document.querySelector('.stamp img')?.complete")
assert page.locator('.e-name').inner_text()=='Jeffrey Peters'
assert page.locator('#index [aria-current]').evaluate("el=>getComputedStyle(el).backgroundColor")== 'rgb(52, 58, 48)'
page.screenshot(path=str(OUT/'desktop-profile.png'))
# Index header remains fixed after scrolling to the last name.
head=page.locator('.index-head').bounding_box()
page.locator('#index').evaluate('(el)=>el.scrollTop=el.scrollHeight')
assert page.locator('.index-head').bounding_box()==head
assert page.locator('#index').bounding_box()['y']>=head['y']+head['height']-1
page.locator('#next-person').click()
page.wait_for_timeout(400)
assert page.locator('.e-name').inner_text()!='Jeffrey Peters'
page.keyboard.press('Escape')
page.wait_for_function("document.querySelector('#reader').hidden")
assert page.locator('.leaf, .sheet, .flyer > *').count()==0
assert page.evaluate("!document.querySelector('#catalog').inert")
# Close/open another volume, capture the cover during its hinge.
page.locator('#q').fill('')
page.locator('[data-vol="19"]').click()
page.wait_for_timeout(1100)
page.screenshot(path=str(OUT/'desktop-opening.png'))
page.wait_for_function("document.querySelector('#book').classList.contains('ready')")
page.keyboard.press('Escape')
page.wait_for_function("document.querySelector('#reader').hidden")
# Reduced motion is immediate, no temporary leaves remain.
page.emulate_media(reduced_motion='reduce')
page.locator('[data-vol="25"]').click()
page.wait_for_function("document.querySelector('#book').classList.contains('ready')")
assert page.locator('.leaf, .sheet').count()==0
page.screenshot(path=str(OUT/'desktop-index.png'))
page.keyboard.press('Escape')
page.wait_for_function("document.querySelector('#reader').hidden")
# Narrow, mobile and short landscape all fit with independently scrollable pages.
for w,h in [(390,844),(320,568),(844,390)]:
 page.set_viewport_size({'width':w,'height':h})
 page.goto(BASE+'/library?person=tyler-mantel',wait_until='networkidle')
 page.wait_for_function("document.querySelector('#book').classList.contains('ready')")
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert page.locator('#book-close').bounding_box()['y']+page.locator('#book-close').bounding_box()['height']<=h
 assert page.locator('.stamp img').count()==1
 if w<760:
  page.locator('#to-index').click()
  page.locator('#index [aria-current]').click()
  assert page.locator('#book').get_attribute('data-view')=='entry'
  assert page.locator('.e-name').inner_text()=='Tyler Mantel'
 page.screenshot(path=str(OUT/f'profile-{w}.png'))
 for _ in range(14):
  page.keyboard.press('Tab')
  assert page.evaluate("document.querySelector('#book').contains(document.activeElement) && getComputedStyle(document.activeElement).visibility !== 'hidden'")
 page.keyboard.press('Escape')
 page.wait_for_function("document.querySelector('#reader').hidden")
 page.screenshot(path=str(OUT/f'room-{w}.png'))
# Dependency failures leave a clear directory route.
nojs=ctx.browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
p=nojs.new_page();p.goto(BASE+'/library');assert p.locator('noscript a').is_visible();p.screenshot(path=str(OUT/'no-js.png'));nojs.close()
failure=ctx.browser.new_context(viewport={'width':390,'height':844})
p=failure.new_page();p.route('**/library.js*',lambda route:route.abort());p.goto(BASE+'/library');assert p.locator('#room-sub a').is_visible();failure.close()
assert not errors,errors
(OUT/'browser-results-v2.json').write_text(json.dumps({'errors':errors,'checks':['26 volumes','2130 records','search and profile','headshots','fixed index header','next profile','close cleanup','cover animation','reduced motion','390/320/844 viewport fit','focus trap','no-JS directory link','failed-bundle directory link']},indent=2)+'\n')
print('Reading room browser checks passed')
