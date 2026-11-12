import type { PlaceGuide } from '@/types';

/**
 * Long-form guides for the three places most visitors to Kathmandu come for.
 *
 * Every fact here is either cited in `sources` or framed as what tradition
 * says ("chronicles credit…"). Stop positions are OpenStreetMap's own; a stop
 * nobody has mapped carries no pin. Photographs are Commons files under the
 * licence named beside them. None of this has been reviewed on site yet, and
 * the guide screen says so.
 */
const UNESCO = { title: 'UNESCO World Heritage Centre: Kathmandu Valley (121)', url: 'https://whc.unesco.org/en/list/121/' };
const OSM = { title: 'OpenStreetMap contributors (stop positions, ODbL)', url: 'https://www.openstreetmap.org/' };

export const PLACE_GUIDES: PlaceGuide[] = [
  {
    placeId: 'wd-Q380384',
    modelId: 'pashupatinath',
    eyebrow: 'Hindu · Bagmati river · World Heritage',
    tagline: 'Shiva’s great temple on the holy river, where daily worship and the last rites of life meet.',
    photos: [
      { file: 'Pashupatinath Temple-2020.jpg', author: 'Bijay Chaurasia', licence: 'CC BY-SA 4.0', caption: 'The two gilded roofs of the main temple' },
      { file: 'The Pashupatinath Temple 27.jpg', author: 'Nabin K. Sapkota', licence: 'CC BY-SA 4.0', caption: 'The rows of stone Shiva shrines on the east bank' },
      { file: 'Pashupatinath Temple on the banks of Bagmati River.jpg', author: 'Sanjib Chaudhary', licence: 'CC BY-SA 4.0', caption: 'The temple seen across the Bagmati' },
      { file: 'Pashupatinath Temple cremations on the Bagmati River.jpg', author: 'Bijay Chaurasia', licence: 'CC BY-SA 4.0', caption: 'The ghats at night' },
      { file: 'Pashupatinath-oberer Zugang-04-Bagmati-2013-gje.jpg', author: 'Gerd Eichmann', licence: 'CC BY-SA 4.0', caption: 'Steps down to the river, upstream of the temple' },
    ],
    facts: [
      { label: 'Worshipped', value: 'Shiva as Pashupati, lord of all beings' },
      { label: 'Temple', value: 'Two-tiered gilded pagoda, about 23.7 m' },
      { label: 'Present form', value: '1692' },
      { label: 'World Heritage', value: '1979, Kathmandu Valley' },
      { label: 'Main courtyard', value: 'Hindus only' },
    ],
    chapters: [
      {
        title: 'Who is worshipped here',
        glance: 'Shiva, as Pashupati: the lord and protector of all living beings. This is Nepal’s most revered Hindu shrine.',
        story:
          'Inside, Shiva is worshipped as a lingam with four faces turned to the four directions, and a fifth, formless face turned upward. A great gilded Nandi, Shiva’s bull, kneels facing the west door. Daily worship is led by priests of a long-standing lineage from southern India.',
        scholar:
          'The temple’s present form dates from 1692; the site is far older, and chronicles place worship here in the first millennium. Its roofs are gilded copper, and each of its four doors is clad in silver. The 3D model in this app gives only the overall height from its source; every other size is an estimate.',
      },
      {
        title: 'The river and the last rites',
        glance: 'The Bagmati is holy, and the ghats beside the temple are where many Hindu families cremate their dead.',
        story:
          'Arya Ghat, just below the temple, is the main cremation ghat. Families bring the body to the river, wash it and carry out the rites before the pyre is lit. Visitors can watch respectfully from the east bank. These are private family moments: do not photograph the people involved.',
        scholar:
          'An evening aarti, a lamp-offering with music, is held on the river bank at dusk, and draws large crowds. Upstream, the river’s condition is a long-running public concern, and clean-up work is visible along the banks.',
      },
      {
        title: 'Festivals',
        glance: 'Maha Shivaratri, in February or March, fills the whole precinct.',
        story:
          'On Shivaratri, pilgrims come from across Nepal and India, and sadhus, Hindu ascetics, gather in large numbers. During Teej, in late summer, women dressed in red come to pray and fast for their families.',
        scholar:
          'Festival dates follow the lunar calendar, so they move each year. Expect very large crowds, long queues and changed routes on those days; check the date before planning a visit.',
      },
    ],
    walk: {
      title: 'Along the Bagmati',
      intro: 'About 1.5 km, mostly level, with steps up the eastern hill. Non-Hindus see the main temple from the gate and the east bank.',
      stops: [
        { name: 'Main temple, west gate', note: 'Look through the gate to the gilded Nandi and the temple. Only Hindus go further.', coordinate: { latitude: 27.710465, longitude: 85.348665 } },
        { name: 'Arya Ghat', note: 'The cremation ghat below the temple. Watch quietly, without photographing families.', coordinate: { latitude: 27.709243, longitude: 85.348402 } },
        { name: 'The east bank terraces', note: 'Cross the footbridge to the rows of small stone Shiva shrines, the best view of the temple.', coordinate: null },
        { name: 'Mrigasthali', note: 'The wooded hill above the east bank, the deer forest of Shiva’s legend.', coordinate: { latitude: 27.711278, longitude: 85.350941 } },
        { name: 'Gorakhnath Temple', note: 'At the top of the steps, a temple to the yogi Gorakhnath.', coordinate: { latitude: 27.71053, longitude: 85.351464 } },
        { name: 'Guhyeshwari Temple', note: 'Downhill to the north-east, a great shrine of the goddess, Shiva’s consort. Its inner courtyard is for Hindus.', coordinate: { latitude: 27.711213, longitude: 85.353299 } },
      ],
    },
    beforeYouGo: [
      { icon: 'account-cancel-outline', title: 'Who may enter', body: 'Only Hindus may enter the main temple courtyard. Everyone may visit the ghats and the east bank.' },
      { icon: 'shoe-print', title: 'No leather', body: 'No leather inside the precinct: shoes, belts and bags.' },
      { icon: 'camera-off-outline', title: 'Photographs', body: 'No photographs of the sanctum, and none of cremations or the families at them.' },
      { icon: 'weather-sunset', title: 'When to go', body: 'Early morning for worship without crowds; dusk for the evening aarti on the river.' },
    ],
    questions: ['Can non-Hindus enter Pashupatinath?', 'How much is the entry fee for Pashupatinath?'],
    sources: [
      { title: 'Pashupati Area Development Trust', url: 'https://pashupati.org.np/' },
      UNESCO,
      { title: 'Pashupatinath Temple, Wikipedia (height and date)', url: 'https://en.wikipedia.org/wiki/Pashupatinath_Temple' },
      OSM,
    ],
  },
  {
    placeId: 'wd-Q889902',
    modelId: 'boudhanath',
    eyebrow: 'Buddhist · Tibetan and Newar · World Heritage',
    tagline: 'One of the largest stupas in Nepal, circled all day by people walking, chanting and turning prayer wheels.',
    photos: [
      { file: 'Boudha Stupa 2018 04.jpg', author: 'Nabin K. Sapkota', licence: 'CC BY-SA 4.0', caption: 'The stupa and its prayer flags' },
      { file: 'Boudhanath Stupa-IMG 7048.jpg', author: 'Bijay Chaurasia', licence: 'CC BY-SA 4.0', caption: 'The terraces, dome and plaza from above' },
      { file: 'Boudhanath stupa bells and Buddha statues in niches Kathmandu Nepal 20Apr2008.jpg', author: 'Everhard van Eimeren', licence: 'CC BY-SA 4.0', caption: 'Niches and prayer wheels around the base' },
      { file: 'Soaring Spirits over Boudhanath Stupa.jpg', author: 'Umes4ever', licence: 'CC BY-SA 4.0', caption: 'Pigeons over the spire' },
      { file: 'Boudhanath, Kathmandu, Nepal.jpg', author: 'Vyacheslav Argenberg', licence: 'CC BY 4.0', caption: 'The eyes on the harmika' },
    ],
    facts: [
      { label: 'Form', value: 'Three terraces, dome, 13-tier spire' },
      { label: 'Height', value: 'About 36 m' },
      { label: 'World Heritage', value: '1979, Kathmandu Valley' },
      { label: 'Restored', value: 'Spire rebuilt after 2015, reopened 2016' },
      { label: 'Walk', value: 'Clockwise, always' },
    ],
    chapters: [
      {
        title: 'Reading the stupa',
        glance: 'The whole stupa is a mandala you can walk: square terraces, a round dome, and a golden spire with watching eyes.',
        story:
          'Three stepped terraces carry a great white dome. On top sits the harmika, a square block painted on each side with the Buddha’s eyes. Above it rise thirteen gilded steps, often read as the stages towards awakening, and a canopy at the very top.',
        scholar:
          'A stupa holds relics and stands for the Buddha’s awakened mind rather than a building to enter. Its height is usually given as about 36 m. The eyes and the curl between them, often read as the Nepali numeral one, are a Nepali convention also seen at Swayambhunath.',
      },
      {
        title: 'The kora',
        glance: 'Walk around it clockwise, keeping the stupa on your right, as everyone else does.',
        story:
          'From before dawn to after dark, people circle the stupa: monks, elderly Tibetans with prayer beads, Newar families, visitors. Many turn the prayer wheels set into the base as they pass, each turn counted as a recitation of the prayer inside.',
        scholar:
          'Circling a sacred object clockwise is shared by Buddhist and Hindu practice in Nepal. Full-moon days and Losar, the Tibetan New Year, bring the biggest crowds, with butter lamps lit around the base.',
      },
      {
        title: 'A Tibetan neighbourhood',
        glance: 'Since the 1960s Boudha has been the heart of Kathmandu’s Tibetan Buddhist community, with dozens of monasteries around the stupa.',
        story:
          'The stupa stood on the old trade route between the valley and Tibet. After 1959 many Tibetans settled here and founded monasteries, and the streets around the circuit are now full of gompas, thangka painting schools and shops selling ritual objects.',
        scholar:
          'Tibetan tradition tells of a poultry-keeping woman who asked for as much land as a buffalo hide would cover, then cut the hide into strips to mark out the stupa’s base. It is a story about devotion, not a dated record; the stupa’s founding date is not known with certainty.',
      },
    ],
    walk: {
      title: 'The kora and the monasteries',
      intro: 'One circuit of the stupa is about 400 m. Go clockwise, then step into the monasteries that welcome visitors.',
      stops: [
        { name: 'The stupa', note: 'Start on the plaza, then climb to the terraces for the view of the dome and the eyes.', coordinate: { latitude: 27.721478, longitude: 85.362012 } },
        { name: 'Thangka schools', note: 'On the south side of the circuit, painters at work on Buddhist scroll paintings.', coordinate: { latitude: 27.720928, longitude: 85.362018 } },
        { name: 'Tashi Samtenling Monastery', note: 'On the east side of the circuit.', coordinate: { latitude: 27.721818, longitude: 85.363085 } },
        { name: 'The great prayer wheel', note: 'On the north side, a chapel housing one very large prayer wheel; walk around it clockwise too.', coordinate: { latitude: 27.722015, longitude: 85.36213 } },
        { name: 'Ghyoilisang Peace Park', note: 'A small park with a pond and a statue of Guru Rinpoche, just north-west of the stupa.', coordinate: { latitude: 27.72237, longitude: 85.361453 } },
        { name: 'Ka-Nying Shedrub Ling', note: 'The large white-and-red monastery a few minutes north, one of the best known in Boudha.', coordinate: { latitude: 27.723997, longitude: 85.362747 } },
      ],
    },
    beforeYouGo: [
      { icon: 'rotate-right', title: 'Clockwise', body: 'Always walk around the stupa, and any shrine or prayer wheel, keeping it on your right.' },
      { icon: 'hand-back-right-outline', title: 'In monasteries', body: 'Take off your shoes, do not point your feet at images, and ask before photographing monks or rituals.' },
      { icon: 'weather-sunset-up', title: 'When to go', body: 'Early morning or at dusk, when local people walk the kora and the butter lamps are lit.' },
      { icon: 'coffee-outline', title: 'Rooftop views', body: 'Many cafés around the circuit have roof terraces facing the stupa.' },
    ],
    questions: ['How much is the entry fee for Boudhanath?', 'What is Boudhanath?'],
    sources: [
      UNESCO,
      { title: 'Boudhanath, Wikipedia (form, height, 2016 reopening)', url: 'https://en.wikipedia.org/wiki/Boudhanath' },
      { title: 'Boudhanath Stupa Area Development Committee', url: 'http://boudhanathstupa.org/' },
      OSM,
    ],
  },
  {
    placeId: 'wd-Q12946982',
    modelId: 'swayambhunath',
    eyebrow: 'Buddhist and Hindu · Hilltop · World Heritage',
    tagline: 'The self-arisen stupa on its hill above the valley, where the story of Kathmandu begins.',
    photos: [
      { file: 'Swayambhunath temple - an ancient religious architecture of Nepal.jpg', author: 'Nirmal Dulal', licence: 'CC BY-SA 4.0', caption: 'The eyes and the gilded spire' },
      { file: 'Swayambhu, Kathmandu, Nepal.jpg', author: 'Vyacheslav Argenberg', licence: 'CC BY 4.0', caption: 'Shrines crowding the hilltop' },
      { file: 'Swoyambhu Mahachaitya,known as Swayambhunath 47.jpg', author: 'Goutam1962', licence: 'CC BY-SA 4.0', caption: 'A white shikhara tower beside the stupa' },
      { file: "Swayambhunath stupa along with Harati Devi's temple and smalles stupas and pagodas in the foreground.jpg", author: 'Prashant Koirala', licence: 'CC BY-SA 4.0', caption: 'The stupa and Harati’s temple' },
      { file: 'Potroit of Rhesus Macaque at Swayambhunath Stupa 01.jpg', author: 'Nabin K. Sapkota', licence: 'CC BY-SA 4.0', caption: 'One of the hill’s rhesus macaques' },
      { file: 'Swoyambhu Mahachaitya, also known as Swayambhunath or the "Monkey Temple," 36.jpg', author: 'Goutam1962', licence: 'CC BY-SA 4.0', caption: 'Prayer wheels around the base' },
    ],
    facts: [
      { label: 'Setting', value: 'Hilltop on the west edge of Kathmandu' },
      { label: 'Eastern stair', value: '365 steps, as traditionally counted' },
      { label: 'World Heritage', value: '1979, Kathmandu Valley' },
      { label: 'Worshipped by', value: 'Newar and Tibetan Buddhists, and Hindus' },
      { label: 'Also called', value: 'The Monkey Temple' },
    ],
    chapters: [
      {
        title: 'The lake and the light',
        glance: 'Legend says the valley was once a lake, and a self-arisen light, Swayambhu, shone from a lotus on it. This hill is where it shone.',
        story:
          'The bodhisattva Manjushri came to worship the light and, to let pilgrims reach it, cut a gorge at Chobhar with his sword. The lake drained, the valley became habitable, and the light was enshrined in the stupa. A small shrine to Manjushri stands on the western hilltop.',
        scholar:
          'Geologists agree that the Kathmandu Valley was once a lake, which gives the legend unusual weight. Chronicles credit the first stupa to King Vrishadeva in the early 5th century; the site has been enlarged and rebuilt many times since.',
      },
      {
        title: 'The stupa and the vajra',
        glance: 'At the top of the eastern stair a great gilded vajra, the thunderbolt, lies before the stupa’s watching eyes.',
        story:
          'The white dome carries a gilded harmika with eyes on all four sides and a spire of thirteen tiers. Niches around the base hold the five Buddhas of meditation, each facing his own direction. Two white shikhara towers, Pratappur and Anantapur, stand on either side of the vajra.',
        scholar:
          'The Pratappur and Anantapur towers were added in the 17th century under King Pratap Malla. Some shrines on the hill were damaged in the 2015 earthquake and have since been restored.',
      },
      {
        title: 'Many traditions on one hill',
        glance: 'Buddhists and Hindus worship side by side here, and so, in their way, do the monkeys.',
        story:
          'Around the stupa stand monasteries, a pagoda to Harati, the goddess who protects children, and the five shrines of the elements: earth, air, fire, water and sky. Rhesus macaques live all over the hill and are part of its character.',
        scholar:
          'The five element shrines, Vasupura, Vayupura, Agnipura, Nagapura and Shantipura, belong to Newar Vajrayana Buddhism; Harati is honoured by Buddhists and Hindus alike, which makes the hill one of the clearest places to see the valley’s shared religious life.',
      },
    ],
    walk: {
      title: 'Up the eastern stair and around the top',
      intro: 'The eastern stair is steep: allow 15 minutes up. A road reaches the western side if the stair is too much.',
      stops: [
        { name: 'The eastern stair', note: 'The pilgrims’ way up, lined with carved animals and small shrines. Take it slowly.', coordinate: { latitude: 27.714532, longitude: 85.292432 } },
        { name: 'The great vajra', note: 'At the top of the stair, before the stupa. Walk around it clockwise.', coordinate: { latitude: 27.714849, longitude: 85.290654 } },
        { name: 'Pratappur and Anantapur', note: 'The two white shikhara towers flanking the vajra.', coordinate: { latitude: 27.714985, longitude: 85.29058 } },
        { name: 'The stupa', note: 'Circle it clockwise, past the five Buddhas in their niches.', coordinate: { latitude: 27.715166, longitude: 85.290356 } },
        { name: 'Harati Temple', note: 'The pagoda to the goddess who protects children, close to the stupa’s north-west side.', coordinate: { latitude: 27.715045, longitude: 85.29021 } },
        { name: 'Shantipura', note: 'The shrine of the sky element, on the north side of the hilltop.', coordinate: { latitude: 27.715647, longitude: 85.290412 } },
        { name: 'Swayambhu Buddhist Museum', note: 'Small museum of sculpture from the hill.', coordinate: { latitude: 27.714828, longitude: 85.290048 } },
        { name: 'Manjushri shrine', note: 'On the western hilltop, for the bodhisattva of the legend.', coordinate: { latitude: 27.715941, longitude: 85.287719 } },
      ],
    },
    beforeYouGo: [
      { icon: 'stairs-up', title: 'The climb', body: 'The eastern stair is steep and uneven. Wear good shoes and carry water.' },
      { icon: 'food-off-outline', title: 'Monkeys', body: 'Keep food and plastic bags out of sight. Do not feed or tease the macaques.' },
      { icon: 'rotate-right', title: 'Clockwise', body: 'Walk around the stupa and the shrines keeping them on your right.' },
      { icon: 'weather-sunset', title: 'When to go', body: 'Early morning, when pilgrims circle the stupa, or late afternoon for the view over the valley.' },
    ],
    questions: ['How much is the entry fee for Swayambhunath?', 'What is Swayambhunath?'],
    sources: [
      UNESCO,
      { title: 'Swayambhunath, Wikipedia (legend, Vrishadeva, the stair)', url: 'https://en.wikipedia.org/wiki/Swayambhunath' },
      OSM,
    ],
  },
];

const byPlace = new Map(PLACE_GUIDES.map((guide) => [guide.placeId, guide]));

export function guideFor(placeId: string): PlaceGuide | undefined {
  return byPlace.get(placeId);
}
