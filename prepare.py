"""Builds the Android project folder from the flat files in the repository."""
import glob, json, os, shutil, sys
from xml.sax.saxutils import escape
from PIL import Image, ImageOps

OUT = 'android'
MAIN = f'{OUT}/app/src/main'
ASSETS = f'{MAIN}/assets'
JAVA = f'{MAIN}/java/ir/myschool/planner'
for d in (ASSETS, JAVA, f'{MAIN}/res/values', f'{MAIN}/res/drawable-nodpi'):
    os.makedirs(d, exist_ok=True)

with open('appname.txt', encoding='utf-8-sig') as f:
    lines = [x.strip() for x in f if x.strip()]
name = lines[0] if lines else 'برنامه درسی من'

res = escape(name).replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"')
if res[0] in '@?':
    res = '\\' + res
with open(f'{MAIN}/res/values/strings.xml', 'w', encoding='utf-8') as f:
    f.write(f'<resources><string name="app_name">{res}</string></resources>\n')

icons = [p for p in ('icon.png', 'icon.jpg', 'icon.jpeg') if os.path.exists(p)]
if not icons:
    sys.exit('icon.png not found')
# if the user adds icon.jpg, it wins over the default icon.png
img = Image.open(icons[-1])
img = ImageOps.exif_transpose(img).convert('RGBA')
ImageOps.fit(img, (432, 432), Image.LANCZOS).save(f'{MAIN}/res/drawable-nodpi/ic_launcher.png')

for f in ('index.html', 'style.css', 'app.js', 'games.js'):
    shutil.copy(f, ASSETS)

def js(value):
    return json.dumps(value, ensure_ascii=False)

with open(f'{ASSETS}/config.js', 'w', encoding='utf-8') as f:
    f.write(f'window.APP_NAME={js(name)};\n')

grades = []
for path in sorted(glob.glob('grade*.json')):
    try:
        with open(path, encoding='utf-8-sig') as f:
            grades.append(json.load(f))
    except ValueError as e:
        sys.exit(f'Error in {path}: {e}')
with open(f'{ASSETS}/lessons.js', 'w', encoding='utf-8') as f:
    f.write(f'window.BUILTIN_GRADES={js(grades)};\n')

shutil.copy('AndroidManifest.xml', MAIN)
shutil.copy('MainActivity.java', JAVA)
shutil.copy('build.gradle', f'{OUT}/app/build.gradle')
shutil.copy('release.keystore', f'{OUT}/app/release.keystore')
with open(f'{OUT}/settings.gradle', 'w') as f:
    f.write("""pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositories { google(); mavenCentral() } }
rootProject.name = 'SchoolPlanner'
include ':app'
""")
print('Ready:', name, '| grades:', len(grades))
