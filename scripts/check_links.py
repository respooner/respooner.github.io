"""Check local HTML links, assets and fragments without network requests."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.links = set(), []
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        for attr in ('href', 'src'):
            if attrs.get(attr):
                self.links.append(attrs[attr])
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh':
            content = attrs.get('content', '')
            if 'url=' in content.lower():
                self.links.append(content.split('=', 1)[1].strip())


documents = {p: Document(p) for p in ROOT.rglob('*.html') if '.git' not in p.parts}
errors, checked = [], 0
for path, document in documents.items():
    for link in document.links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        target = ((ROOT / unquote(url.path).lstrip('/')) if url.path.startswith('/')
                  else (path.parent / unquote(url.path))) if url.path else path
        target = target.resolve()
        if not target.is_relative_to(ROOT):
            errors.append(f'{path.relative_to(ROOT)}: path escapes repository: {link}')
            continue
        if target.is_dir():
            target /= 'index.html'
        checked += 1
        if not target.is_file():
            errors.append(f'{path.relative_to(ROOT)}: missing target: {link}')
        elif url.fragment and target in documents and unquote(url.fragment) not in documents[target].ids:
            errors.append(f'{path.relative_to(ROOT)}: missing anchor: {link}')

for route in ['index.html', 'mini-arcade/index.html', 'games/index.html', 'shen-majun-portfolio/index.html']:
    if not (ROOT / route).is_file():
        errors.append(f'Missing required entry point: {route}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {checked} local references across {len(documents)} HTML pages; entry points present.')
