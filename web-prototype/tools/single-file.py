"""Turns dist/ into one self-contained HTML body for sharing as a single page (team phone testing).
Usage: python3 tools/single-file.py dist OUT.html"""
import re, sys, pathlib
dist, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
html = (dist / 'index.html').read_text()
m = re.search(r'<script type="module" crossorigin src="\./(assets/[^"]+\.js)"></script>', html)
js = (dist / m.group(1)).read_text().replace('</script', '<\\/script')
html = html.replace(m.group(0), '')
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
head = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', '', head)
page = head.strip() + '\n<style>:root{color-scheme:dark}</style>\n' + body.strip() + '\n<script type="module">\n' + js + '\n</script>\n'
out.write_text(page)
print(out, len(page), 'bytes')
