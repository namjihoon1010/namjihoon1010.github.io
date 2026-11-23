# Cache busting. GitHub Pages serves every file with "Cache-Control: max-age=600", so phones keep
# using an old case.css / case.js / spin.js for a while after a push. This stamps each reference
# with a hash of the file's content (?v=xxxxxxxx), so a changed file always gets a new URL.
# Run before every push:  python tools/bust.py
import glob, hashlib, re

assets = ['case.css', 'case.js', 'spin.js']
ver = {a: hashlib.md5(open(a, 'rb').read()).hexdigest()[:8] for a in assets}
pat = re.compile(r'(href|src)="(' + '|'.join(map(re.escape, assets)) + r')(\?v=\w+)?"')
for f in glob.glob('*.html'):
    s = open(f, encoding='utf-8').read()
    t = pat.sub(lambda m: f'{m.group(1)}="{m.group(2)}?v={ver[m.group(2)]}"', s)
    if t != s:
        open(f, 'w', encoding='utf-8').write(t)
        print('stamped', f)
print(ver)
