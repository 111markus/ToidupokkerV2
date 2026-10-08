# Toidupokker

Eestikeelne, mobiilisõbralik toitumispüramiidi kaardimäng 16–19-aastastele. Õpetus ja seitsmepäevane päriselu on eraldi lõpuni mängitavad faasid. Mõlemas on valiku tagasiside, visuaalne püramiid, vee taastamine, tulemused ja uuesti alustamine.

## Käivitamine

Vaja on Node.js 20 või uuemat. Sõltuvusi pole vaja paigaldada.

```sh
npm run dev
```

Ava http://127.0.0.1:5173. Veebirakenduse avaldatavad failid asuvad `game/dist/`. Mängu olek on brauseri mälus; lehe värskendamine alustab uuesti.

```sh
npm test
npm run check
```

Käsud töötavad nii repositooriumi juurkaustas kui ka `game/` kaustas.

## Render deployment

The app is a static site: `game/dist/` already contains the deployable HTML, CSS, JavaScript, and image. `npm run build` checks JavaScript syntax; it does not need a bundling step.

For a **Static Site** in Render, connect this repository with these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `game` |
| Build Command | `npm run build` |
| Publish Directory | `dist` |

Alternatively, create a Render Blueprint from the repository-root `render.yaml`, which defines these static-site settings. Adding `render.yaml` does not automatically change an existing service created manually.

For an existing Node **Web Service**, these settings also work:

| Setting | Value |
| --- | --- |
| Root Directory | Leave empty (repository root) |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

The root `package.json` forwards these commands to `game/`. The server binds to `0.0.0.0` on Render's `PORT`. Local development defaults to `127.0.0.1:5173`; `HOST` and `PORT` can override those values.

Commit and push the deployment changes to GitHub before redeploying in Render.

References: [Render static sites](https://render.com/docs/static-sites), [monorepo root directories](https://render.com/docs/monorepo-support), and [web service port binding](https://render.com/docs/web-services#port-binding).

## Cat mascot

- Edit all Estonian dialogue in `game/dist/cat-lines.js`.
- Replace the inline SVG in `catArtwork()` in `game/dist/cat-mascot.js` to swap the character. Expression selection reads existing move feedback and never changes the game engine.
- The bubble persists until the next move, including the last move on day/final summaries. Starting or restarting either phase clears it; moving to the next day keeps the last line.
- Priority: category overflow, snack, two-point card, category pick; water has its own pool. Repeat snacks use their penalty lines with a cheeky expression; snack overflow uses an angry expression. Optional food-specific lines appear occasionally only without life loss.
- Lines are not repeated consecutively when the matching pool contains an alternative. Exact single-line penalties can repeat when that penalty happens on consecutive moves.
- Short-phone layouts compact the play area and use the cat as the visible move feedback. Reduced motion disables cat/bubble animation. The bubble follows the system color scheme or a parent `data-theme="light"` / `data-theme="dark"`.

## Reeglite täpsustused

- Õpetus: 27 erinevat ühepunktilist kaarti. Kuna algtekst ei määratle õpetuse täpset 27-kaardilist nimekirja, valitakse igaks mänguks 6 teravilja-, 7 köögivilja-, 4 piima-, 3 rasva-, 5 valgu- ja 2 snäkikaarti ühepunktiliste toitude nimekirjast. Eesmärgid 2/2/1/1/1, kuni 9 vooru. Õpetuses peatub põhigrupi punktisumma sihtkoguse juures; üleliigne valik kulutab vett.
- Päriselu: kogu antud füüsiline pakk — 56 ühepunktilist ja 28 kahepunktilist kaarti, kokku 84. Iga päeva 12 kaardi seas on erinevad toidunimed; päevade vahel võivad toidunimed korduda eri füüsilistel kaartidel. Juhuslik päevavalik hajutab korduskoopiad allesjäänud päevade vahel, et ka seitsmendal päeval oleks võimalik saada 12 erinevat toitu. Kõik pakutud kolm kaarti eemaldatakse pärast valikut. Ülempiiri ületavad punktid jäävad nädala summasse, et ülejääk oleks nähtav ning võidutingimus korrektne.
- Snäkid ei täida põhigruppe. Esimene snäkikaart on tasuta, iga järgmine snäkikaardi valik kulutab ühe vee. Snäkkide komponendid lähevad eraldi snäkiarvestusse; kahe snäkikomponendiga krõpsukaart lisab sinna 2. Päriselu ülempiiri 3 ületavad snäkipunktid võivad kulutada kuni 2 vett. Korduva snäkivaliku ja snäki ülempiiri karistusi ei liideta topelt. Snäki ja rasva kaart võib kulutada vett mõlema komponendi eest.
- Seitsmenda päeva lõpus on võiduks vaja kõigi viie põhigrupi miinimumi ning kõigi gruppide ülempiiride järgimist. Vee otsasaamine lõpetab mängu kohe.
- Pärast õpetuse kuuendat vooru on seni täiesti puuduva grupi kaardil järgmistesse tõmmetesse jõudmiseks suurem tõenäosus, kui selline kaart on alles.

Mängupunktid ei ole portsjonid ja veed ei väljenda joogivee vajadust. Püramiid on õppimiseks lihtsustatud. Toitumispüramiidi allikas: [Tervise Arengu Instituudi toidusoovitused](https://toitumine.ee/kuidas-tervislikult-toituda/toidusoovitused).

Algusvaate originaalne toidukollaaž on loodud imagegeniga. Toidukaartidel kasutatakse seadme emotikone. Kujunduse Google Fonts kirjatüüpidel on lokaalsed varuvariandid.
