// Records the real 3D scans of our places that are published on Sketchfab.
//
//   node tools/data/build-scans.mjs
//
// The scans are not copied: most are not openly licensed. The app and the
// website show them through Sketchfab's own embedded player, which the
// platform offers for public models and which keeps the creator's credit on
// screen. This script freezes what we show about each one (title, creator,
// licence, thumbnail) so a page never has to ask Sketchfab until a visitor
// chooses to open a scan.
//
// Each scan was chosen by eye for what it is: a real capture of the place
// (photogrammetry or drone survey), or an artist's model, labelled as such.
// Interior altars were left out on purpose.
import { writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const AGENT = 'saksi-data-pipeline/1.0 (open heritage guide; https://github.com/siddantasodari4-eng/saksi)';

/*
 * Where each scan stands on the map: `at` is [latitude, longitude] from the
 * OpenStreetMap feature named in the comment (the same map the app draws), or
 * the site's centre where the scan covers a whole site. A pin, not a survey.
 */
const SWAYAMBHU = [27.714931, 85.290391]; // OSM way 201223707, the stupa
const YETKHA = [27.706655, 85.306527]; // OSM way 80913260

/** uid → what it is and where it belongs. `targets` are site or place ids. */
const CHOSEN = [
  { uid: '4cdd98a88d3740ccb55c7510725bd98c', label: 'Maya Devi Temple and the Sacred Garden', kind: 'drone survey', targets: ['maya-devi-temple'], at: [27.469609, 83.275831] /* OSM way 343151593 */, note: 'The temple, the Puskarini pond and the excavated ground around them, from the air.' },
  { uid: 'f65cb3c34adb4473b50b8d70ef9f534c', label: 'World Peace Pagoda, Lumbini', kind: 'drone survey', targets: ['world-peace-pagoda'], at: [27.498907, 83.276262] /* OSM way 844764523 */, note: 'The World Peace Pagoda in the Lumbini development zone.' },
  { uid: 'b712936720594f8fb155338178e6495b', label: 'Samai Mai shrine, Tilaurakot', kind: 'photogrammetry', targets: ['tilaurakot'], at: [27.575876, 83.054811] /* OSM relation 19990298, the site */, note: 'The Samai Mai shrine after conservation, recorded by the UNESCO Chair team at Durham University.' },
  { uid: '5dabfc2162fa44b4b415caf9358faddb', label: 'Swayambhu hill, from the air', kind: 'drone survey', targets: ['wd-Q12946982'], at: SWAYAMBHU, note: 'The whole hilltop as a drone-captured point cloud, 6.7 million measured samples: the stupa, its shrines and the forest around them.' },
  { uid: '3d3ea93250734ccfb0a355d9e77c1453', label: 'Swayambhunath stupa and hilltop', kind: 'photogrammetry', targets: ['wd-Q12946982'], at: SWAYAMBHU, note: 'The great stupa with the shrines and houses packed round it.' },
  { uid: '5da6a460cc3648dd955410f074555ed0', label: 'A gilded shrine, Swayambhu', kind: 'photogrammetry', targets: ['wd-Q12946982'], at: SWAYAMBHU, note: 'A gilded shrine on the hilltop, with its torana and offerings.' },
  { uid: 'ad0c99960e7745708e7a9c1ef5c3b7ad', label: 'A temple on the Swayambhu hilltop', kind: 'photogrammetry', targets: ['wd-Q12946982'], at: SWAYAMBHU, note: 'A temple on the Swayambhu hilltop, scanned with the custodians’ permission.' },
  { uid: '1114c3da452c423c868aa91216310edc', label: 'The great vajra, Swayambhu', kind: 'photogrammetry', targets: ['wd-Q12946982'], at: SWAYAMBHU, note: 'The great vajra at the top of the eastern stair.' },
  { uid: '38def5caf9dc43b4aa1b6fd5ba36c8bb', label: 'A small chaitya, Swayambhu', kind: 'photogrammetry', targets: ['wd-Q12946982'], at: SWAYAMBHU, note: 'One of the small chaityas crowding the hilltop.' },
  { uid: '6f5e13385ea74742a5af1e5338bde70b', label: 'Kathmandu Durbar Square after the 2015 earthquake', kind: 'drone survey', captured: 'May 2015', targets: ['kathmandu-durbar-square'], at: [27.70377, 85.306524] /* OSM relation 3498817, Basantapur Dabali */, note: 'Recorded by drone days after the 25 April 2015 earthquake: a record of the damage, not of the square today.' },
  { uid: 'ebb0f90762b34821b147fcc470916510', label: 'The Taleju gate, 1564', kind: 'photogrammetry', targets: ['ktm-taleju-temple', 'kathmandu-durbar-square'], at: [27.704902, 85.307957] /* OSM way 1414600808, Taleju */, note: 'The carved main gate to the Taleju temple in Hanuman Dhoka, dated 1564.' },
  { uid: '0db5beb3c6cb45f2b6c3fb63cc342044', label: 'Kal Bhairav, Kathmandu Durbar Square', kind: 'photogrammetry', targets: ['ktm-kal-bhairav', 'kathmandu-durbar-square'], at: [27.704725, 85.307092] /* OSM way 196261745 */, note: 'The great stone Kal Bhairav, painted and garlanded, where oaths were once sworn.' },
  { uid: 'a172a6c625a84181b68fa4284679de1e', label: 'Kasthamandap, rebuilding', kind: 'drone survey', targets: ['ktm-kasthamandap', 'kathmandu-durbar-square'], at: [27.703934, 85.305779] /* OSM way 183558418 */, note: 'Kasthamandap during its rebuilding after the 2015 earthquake.' },
  { uid: 'dedca951739f4362b51b777d3ea826e1', label: 'Yetkha Bahal', kind: 'photogrammetry', targets: ['osm-way-80913260'], at: YETKHA, note: 'The white stupa in the courtyard of Yetkha Bahal, a Buddhist monastery courtyard near Durbar Square.' },
  { uid: '0d0fad4b2f1b459e8ca5cc0e86542882', label: 'Yetkha Bahal shrine', kind: 'photogrammetry', targets: ['osm-way-80913260'], at: YETKHA, note: 'The shrine of Yetkha Bahal, its painted wooden front and doorway.' },
  { uid: 'c5bdfc4d02fa4c668b8e1bf31beca067', label: 'Keshar Mahal', kind: 'drone survey', targets: ['osm-node-1962909336'], at: [27.714221, 85.314718] /* OSM way 201527440 */, note: 'The Rana palace that holds the Keshar Library, beside the Garden of Dreams, from the air.' },
  { uid: 'e28fe3fbf3a14c4f8aa83316382d8dc4', label: 'Krishna Mandir, Patan', kind: 'photogrammetry', targets: ['patan-krishna-mandir', 'patan-durbar-square'], at: [27.673623, 85.324964] /* OSM way 120443307 */, note: 'The stone shikhara temple of 1637, built in a single style from top to plinth.' },
  { uid: '347100710a0645a0bae86980dfa3e977', label: 'Tusha Hiti, Patan', kind: 'photogrammetry', targets: ['patan-sundari-chowk', 'patan-durbar-square'], at: [27.672722, 85.325134] /* OSM node 10034234966 */, note: 'Tusha Hiti, the sunken royal bath in Sundari Chowk, with its carved stone frieze.' },
  { uid: 'aa7e000993424adc87ababd87921ac7e', label: 'A stone inscription, Bhaktapur', kind: 'photogrammetry', targets: ['wd-Q4900869'], at: [27.672188, 85.427904] /* OSM way 1192827651, the square */, note: 'An inscribed stone in Bhaktapur Durbar Square.' },
  { uid: 'd1dbd0e3109548f3a99ae4a2eca1493b', label: 'Pashupatinath Temple', kind: "artist's model", targets: ['wd-Q380384'], at: [27.710465, 85.348665] /* OSM way 913170315 */, note: 'A modelled reconstruction of the main temple, not a scan. Only Hindus may enter the real courtyard.' },
  { uid: '38aa9a9e585d4bcd956897b472165fd0', label: 'Stone tap, Nag Bahal, Patan', kind: 'photogrammetry', targets: [], at: [27.6759896, 85.3242483] /* OSM way 608630219, Nagbahal hiti */, note: 'A stone water spout (dhunge dhara) in the Nag Bahal courtyard, green with algae, still part of daily life.' },
  { uid: 'c7452743c2f44ce3bacc212b7b4c5ee0', label: 'Bagdwar, source of the Bagmati', kind: 'photogrammetry', targets: [], at: [27.8113122, 85.3904385] /* the creator's stated coordinates */, note: 'The small square at 2,490 m in Shivapuri where the Bagmati rises, with its pond, lingas and carved stone idols.' },
  { uid: '1faa2c27977041ad8877c88abecc8d24', label: 'Tsarang palace ruins, Mustang', kind: 'drone survey', targets: [], at: [29.092717, 83.9337] /* OSM node 973483428, Royal Palace */, note: 'The ruined royal palace of Tsarang in Upper Mustang, on its cliff edge, from the air.' },
  { uid: 'f1fd9e48edfb460e94af17420e747520', label: 'Ghemi, Mustang', kind: 'drone survey', targets: [], at: [29.063083, 83.87301] /* OSM node 5669703905, the village */, note: 'The old palace quarter of Ghemi village in Upper Mustang, from the air.' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const scans = [];
for (const pick of CHOSEN) {
  const response = await fetch(`https://api.sketchfab.com/v3/models/${pick.uid}`, { headers: { 'User-Agent': AGENT } });
  if (!response.ok) throw new Error(`Sketchfab ${pick.uid}: ${response.status}`);
  const m = await response.json();
  const thumb = [...m.thumbnails.images].sort((a, b) => Math.abs(a.width - 720) - Math.abs(b.width - 720))[0];
  // A larger frame for a page's main stage, where 720 px would look soft on a sharp screen.
  const poster = [...m.thumbnails.images].sort((a, b) => Math.abs(a.width - 1280) - Math.abs(b.width - 1280))[0];
  const licence = m.license && typeof m.license === 'object' ? m.license.label : null;
  scans.push({
    id: m.uid,
    label: pick.label,
    title: m.name.trim(),
    creator: m.user.displayName,
    creatorUrl: m.user.profileUrl,
    viewerUrl: m.viewerUrl,
    licence: licence ?? 'Not offered for download: shown in Sketchfab’s player, not copied',
    openLicence: Boolean(licence && /^CC /.test(licence)),
    kind: pick.kind,
    captured: pick.captured ?? null,
    published: m.publishedAt?.slice(0, 10) ?? m.createdAt?.slice(0, 10) ?? null,
    thumbnail: thumb.url,
    poster: poster.url,
    targets: pick.targets,
    at: { latitude: pick.at[0], longitude: pick.at[1] },
    note: pick.note,
  });
  console.log(`  ${m.name} · ${m.user.displayName} · ${licence ?? 'no open licence'}`);
  await sleep(300);
}

writeFileSync(
  new URL('seed/scans.json', ROOT),
  `${JSON.stringify({ _about: 'Real 3D scans of our places on Sketchfab, shown through its embedded player. Generated by tools/data/build-scans.mjs; do not edit.', scans }, null, 1)}\n`,
);
console.log(`${scans.length} scans`);
