"""Renderiza una plantilla HTML de store-assets a PNG con Chrome headless.

Renderiza al doble de resolución y reduce al tamaño final para suavizar texto.
Requiere Google Chrome y Pillow.

Uso:
  python3 store-assets/render.py promo-small.html promo-small-440x280.png 440x280
  python3 store-assets/render.py screenshot.html screenshot-1.png 1280x800 \
      img=captures/editor-1.png "title=Señala el bug exacto" "subtitle=Flechas, formas y post-its."
"""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlencode

from PIL import Image

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SCALE = 2


def main() -> None:
    if len(sys.argv) < 4:
        sys.exit(__doc__)

    here = Path(__file__).resolve().parent
    template = here / sys.argv[1]
    output = here / sys.argv[2]
    width, height = (int(v) for v in sys.argv[3].lower().split('x'))
    params = dict(arg.split('=', 1) for arg in sys.argv[4:])

    url = template.as_uri() + (f'?{urlencode(params)}' if params else '')
    profile = tempfile.mkdtemp()
    raw = Path(profile) / 'raw.png'
    try:
        subprocess.run(
            [
                CHROME,
                '--headless=new',
                '--disable-gpu',
                '--hide-scrollbars',
                '--allow-file-access-from-files',
                f'--user-data-dir={profile}',
                f'--force-device-scale-factor={SCALE}',
                f'--window-size={width},{height}',
                '--virtual-time-budget=2000',
                f'--screenshot={raw}',
                url,
            ],
            check=True,
            capture_output=True,
        )
        Image.open(raw).convert('RGB').resize((width, height), Image.LANCZOS).save(output, optimize=True)
    finally:
        shutil.rmtree(profile, ignore_errors=True)

    print(f'{output.relative_to(here.parent)} ({width}x{height})')


if __name__ == '__main__':
    main()
