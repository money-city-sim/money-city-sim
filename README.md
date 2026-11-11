# Money City — HD web version

Live site: https://money-city-sim.github.io/money-city-sim/

The **Sim World** of Money City as a standalone website: a fictional, self-running world of eight countries, with an **HD graphics pack** that loads real 3D assets. This public copy has only the simulation. The personal Real World mode is removed, along with every personal detail in its code.

## What's in here

| File | What it is |
|---|---|
| `index.html` | The whole app: world generation, economy sim, people, UI and the 3D renderer (Sim World only) |
| `state.json` | A snapshot of the live world (economy, laws, news, history) exported from the private claude.ai version; the site advances it to the current time |
| `hd.js` | HD graphics pack, turned on by choosing **🎨 Graphics → HD (real models)** |
| `Soldier.gltf.json`, `Xbot.gltf.json` | Rigged, animated people (walk / run / idle) |
| `Horse.gltf.json`, `Parrot.gltf.json`, `Stork.gltf.json`, `Flamingo.gltf.json` | Animated animals and birds |
| `venice_sunset_1k.hdr.json` | HDR sky, used for image-based lighting and reflections |
| `waternormals.jpg`, `grasslight-big.jpg` | Ocean normal map and ground detail texture |

The models are glTF files stored as `.json`, with their binary data embedded, so any static host serves them.

## Run it on your computer

Any static web server works. For example:

```
cd money-city-hd
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from the file system won't load the HD pack, because browsers block `fetch()` on `file://` pages.

## Put it online (free)

**GitHub Pages**
1. Create a new repository on GitHub, for example `money-city`.
2. Upload every file in this folder to the repository root.
3. Go to **Settings → Pages → Build and deployment** and pick **Deploy from a branch**, `main`, `/ (root)`.
4. After about a minute the site is live at `https://<owner>.github.io/<repo>/`.

**Vercel or Netlify:** drag this folder onto their dashboard to publish it as a static site.

## How it relates to the claude.ai artifact

- The private claude.ai version keeps the live world in its own database, where the scheduled government, news and live-update tasks write.
- This site starts from `state.json`, a snapshot of that world, and runs the same simulation forward on the same clock. To bring in newer laws and news, replace `state.json` with a fresh export. A scheduled task can do this automatically once the repository is connected.

## Credits

The 3D assets come from the three.js examples repository (MIT-licensed project). Each asset keeps its original author's license:

- Soldier and X Bot characters: Mixamo (Adobe).
- Horse, Parrot, Stork and Flamingo: mirada / ro.me.
- Venice Sunset HDRI: Poly Haven (CC0).
- Water normals and grass textures: three.js examples.

These assets are fine for a personal, non-commercial project like this one. Check each license before using them commercially.
