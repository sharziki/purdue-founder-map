#!/usr/bin/env python3
"""Import explicitly named Purdue 38 by 38 portraits, preserving source evidence."""
import concurrent.futures, io, json, re, unicodedata
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
def normalized(s):
    return re.sub(r'[^a-z ]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip()
def fetch(person):
    try:
        url=person['source_url']
        response=requests.get(url,timeout=25);response.raise_for_status()
        soup=BeautifulSoup(response.text,'html.parser')
        wanted=normalized(person['name'])
        candidates=[img for img in soup.select('img[alt]') if normalized(img['alt']).removeprefix('photo of ').rstrip()==wanted]
        if len(candidates)!=1:return None
        src=urljoin(url,candidates[0]['src'])
        data=requests.get(src,timeout=25);data.raise_for_status()
        im=Image.open(io.BytesIO(data.content));im=im.convert('RGB');im.thumbnail((560,700))
        if min(im.size)<100:return None
        dest=ROOT/'public/assets/alumni'/f"{person['id']}.webp"
        im.save(dest,quality=88)
        return person['id'],{'image':'/assets/alumni/'+dest.name,'image_source_url':src,'image_page_url':url,'image_alt_evidence':candidates[0]['alt']}
    except (requests.RequestException,ValueError,OSError,KeyError):return None
if __name__=='__main__':
    rows=json.loads((ROOT/'public/alumni.json').read_text())['alumni']
    path=ROOT/'data/alumni-portraits.json'
    out=json.loads(path.read_text()) if path.exists() else {}
    rows=[p for p in rows if '/38_38/' in p['source_url'] and p['id'] not in out]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(fetch,rows):
            if result:out[result[0]]=result[1]
    path.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
    print(f'{len(out)} portraits with exact named image evidence')
