# Toidupokker

Eestikeelne, mobiilisõbralik toitumispüramiidi kaardimäng 16–19-aastastele. Õpetus ja seitsmepäevane päriselu on eraldi lõpuni mängitavad faasid. Mõlemas on valiku tagasiside, visuaalne püramiid, vee taastamine, tulemused ja uuesti alustamine.

## Käivitamine

Vaja on Node.js 20 või uuemat. Sõltuvusi pole vaja paigaldada.

```sh
cd game
npm run dev
```

Ava http://127.0.0.1:5173. Veebirakenduse avaldatavad failid asuvad `game/dist/`. Mängu olek on brauseri mälus; lehe värskendamine alustab uuesti.

```sh
cd game
npm test
npm run check
```

## Reeglite täpsustused

- Õpetus: 27 erinevat ühepunktilist kaarti. Kuna algtekst ei määratle õpetuse täpset 27-kaardilist nimekirja, valitakse igaks mänguks 6 teravilja-, 7 köögivilja-, 4 piima-, 3 rasva-, 5 valgu- ja 2 snäkikaarti ühepunktiliste toitude nimekirjast. Eesmärgid 2/2/1/1/1, kuni 9 vooru. Õpetuses peatub põhigrupi punktisumma sihtkoguse juures; üleliigne valik kulutab vett.
- Päriselu: kogu antud füüsiline pakk — 56 ühepunktilist ja 28 kahepunktilist kaarti, kokku 84. Iga päeva 12 kaardi seas on erinevad toidunimed; päevade vahel võivad toidunimed korduda eri füüsilistel kaartidel. Juhuslik päevavalik hajutab korduskoopiad allesjäänud päevade vahel, et ka seitsmendal päeval oleks võimalik saada 12 erinevat toitu. Kõik pakutud kolm kaarti eemaldatakse pärast valikut. Ülempiiri ületavad punktid jäävad nädala summasse, et ülejääk oleks nähtav ning võidutingimus korrektne.
- Snäkid ei täida põhigruppe. Esimene snäkikaart on tasuta, iga järgmine snäkikaardi valik kulutab ühe vee. Snäkkide komponendid lähevad eraldi snäkiarvestusse; kahe snäkikomponendiga krõpsukaart lisab sinna 2. Päriselu ülempiiri 3 ületavad snäkipunktid võivad kulutada kuni 2 vett. Korduva snäkivaliku ja snäki ülempiiri karistusi ei liideta topelt. Snäki ja rasva kaart võib kulutada vett mõlema komponendi eest.
- Seitsmenda päeva lõpus on võiduks vaja kõigi viie põhigrupi miinimumi ning kõigi gruppide ülempiiride järgimist. Vee otsasaamine lõpetab mängu kohe.
- Pärast õpetuse kuuendat vooru on seni täiesti puuduva grupi kaardil järgmistesse tõmmetesse jõudmiseks suurem tõenäosus, kui selline kaart on alles.

Mängupunktid ei ole portsjonid ja veed ei väljenda joogivee vajadust. Püramiid on õppimiseks lihtsustatud. Toitumispüramiidi allikas: [Tervise Arengu Instituudi toidusoovitused](https://toitumine.ee/kuidas-tervislikult-toituda/toidusoovitused).

Algusvaate originaalne toidukollaaž on loodud imagegeniga. Toidukaartidel kasutatakse seadme emotikone. Kujunduse Google Fonts kirjatüüpidel on lokaalsed varuvariandid.
