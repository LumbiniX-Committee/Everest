import type { Coordinate, Quest, QuestWithProgress } from '@/types';
import { distanceMeters } from '@/utils';
import { demoPrecincts } from './demo/precincts';
import { findSite, findVantage } from './generated/sites';

export type QuestArea = {
  id: string;
  name: string;
  coordinate: Coordinate;
  siteIds: string[];
};

// Visitor areas are broader than the small arrival geofences. All of Lumbini's
// garden and monastic activities belong together, even while crossing zones.
export const questAreas: QuestArea[] = [
  { id: 'lumbini', name: 'Lumbini', coordinate: { latitude: 27.46964, longitude: 83.27583 }, siteIds: demoPrecincts.slice(0, 4).flatMap((p) => p.siteIds) },
  ...demoPrecincts.slice(4).map((p) => ({ id: p.id, name: p.name, coordinate: p.centre, siteIds: p.siteIds })),
  // UNESCO monument-zone coordinate: https://whc.unesco.org/en/list/121/maps/
  { id: 'bhaktapur', name: 'Bhaktapur Durbar Square', coordinate: { latitude: 27.6724261, longitude: 85.4284669 }, siteIds: [] },
];

type Challenge = [id: string, area: string, title: string, instruction: string, care: string, icon: string, place?: string];
const challenges: Challenge[] = [
  ['quiet-minute', 'lumbini', 'One quiet minute', 'Sit quietly in a permitted garden spot. Use the timer for a memory after your minute of stillness.', 'Keep paths clear. Photograph yourself, not people praying.', 'meditation', 'maya-devi-temple'],
  ['pond-reflection', 'lumbini', 'Catch a reflection', 'Find a reflection in Puskarini from the public path and frame it with the garden.', 'Stay back from the water and follow photography signs.', 'water-outline', 'puskarini'],
  ['roof-rhythm', 'lumbini', 'Find a roof rhythm', 'Notice a repeating roof detail around a monastery. Capture your favourite pattern from outside.', 'Ask before entering. Avoid ceremonies and restricted interiors.', 'shape-outline', 'myanmar-temple'],
  ['peace-postcard', 'lumbini', 'Your peace postcard', 'Make a wide landscape photo of the Peace Pagoda from a permitted public spot.', 'Keep quiet and leave entrances clear.', 'image-outline', 'world-peace-pagoda'],
  ['garden-colours', 'lumbini', 'Three garden colours', 'Find three natural colours along a garden path and include them in one picture.', 'Leave flowers and plants where they grow.', 'palette-outline', 'maya-devi-temple'],
  ['patan-roofline', 'patan-durbar-square', 'Frame the skyline', 'Make a wide photo with three different temple rooflines from the public square.', 'Keep both feet on public ground; no climbing for a better view.', 'panorama-outline', 'patan-durbar-square'],
  ['patan-hiti', 'patan-durbar-square', 'Follow the water', 'Find Manga Hiti and capture the carved spout from the public viewing edge.', 'Give water users privacy. Do not touch or enter the spout.', 'water-outline', 'manga-hiti'],
  ['patan-carving', 'patan-durbar-square', 'Tiny detail, big discovery', 'Find a carved detail near Krishna Mandir that you almost walked past. Make it the hero of a photo.', 'Use zoom from a permitted spot; never touch carvings.', 'magnify', 'patan-krishna-mandir'],
  ['patan-friends', 'patan-durbar-square', 'Friends in the square', 'Take a relaxed portrait with willing travel companions and a little of the square behind you.', 'Ask everyone first. Keep worshippers out of frame and doorways clear.', 'account-group-outline', 'patan-durbar-square'],
  ['patan-craft', 'patan-durbar-square', 'Meet a maker', 'Ask a nearby craft seller about one handmade object. With permission, photograph the object you liked.', 'Accept a no. Ask before photographing people, work or a shop.', 'hand-heart-outline', 'patan-durbar-square'],
  ['ktm-city-frame', 'kathmandu-durbar-square', 'The city in one frame', 'Find a public angle with a roofline, a courtyard and everyday street life.', 'Avoid identifiable strangers and keep the walking route clear.', 'panorama-outline', 'kathmandu-durbar-square'],
  ['ktm-guardian', 'kathmandu-durbar-square', 'Guardian detail hunt', 'Spot an animal or guardian detail near Hanuman Gate and capture it from the public side.', 'Stay behind barriers and do not interrupt worship.', 'magnify', 'ktm-hanuman-gate'],
  ['ktm-snack', 'kathmandu-durbar-square', 'Let a local choose', 'Ask a willing nearby vendor about a snack. Try one if it suits you, or photograph their recommended display with permission.', 'Check ingredients for your needs; buying is optional. Ask before photos.', 'food-outline', 'kathmandu-durbar-square'],
  ['ktm-colour', 'kathmandu-durbar-square', 'One colour, three details', 'Pick a colour and find three details around the square that share it. Capture your favourite combination.', 'Leave offerings and objects untouched.', 'palette-outline', 'kathmandu-durbar-square'],
  ['ktm-companions', 'kathmandu-durbar-square', 'Your travel-team postcard', 'Make a photo with willing companions in an open public part of Basantapur.', 'No stunts, costumes mocking worship, or blocked entrances.', 'account-group-outline', 'ktm-basantapur-durbar'],
  // Food and pottery associations: https://ntb.gov.np/bhaktapur and
  // https://photo.ntb.gov.np/photo/2200/juju-dhau
  ['juju-dhau', 'bhaktapur', 'The Juju Dhau taste dare', 'Try Juju Dhau from a nearby shop and photograph your serving. Tell your memory what the taste was like.', 'Check dairy ingredients. If unsuitable, ask about it and photograph the display with permission.', 'food-outline'],
  ['pottery', 'bhaktapur', 'Clay in the making', 'Visit Pottery Square. Ask a maker about their craft and photograph a piece with permission.', 'Do not handle drying pots or enter a workspace uninvited.', 'hand-heart-outline'],
  ['bhaktapur-roofs', 'bhaktapur', 'Find the layered skyline', 'Walk towards Taumadhi and make a wide photo of the rooflines from public ground.', 'No climbing for the shot; keep temple access clear.', 'panorama-outline'],
  ['bhaktapur-window', 'bhaktapur', 'A window worth remembering', 'Find a carved window detail around Durbar Square and frame its pattern from outside.', 'Respect private homes and do not photograph through windows.', 'window-closed-variant'],
  ['changu-detail', 'changu-narayan', 'Spot the smallest guardian', 'Find a carved guardian detail in a permitted public part of the temple precinct and photograph it.', 'Keep quiet, follow signs and leave the carvings untouched.', 'magnify', 'changu-narayan'],
  ['tilaurakot-path', 'tilaurakot', 'Walk the old city edge', 'Follow a marked visitor path and capture a view that helps you imagine the old city.', 'Stay on marked paths and outside archaeological remains.', 'walk', 'tilaurakot'],
  ['ramagrama-stillness', 'ramagrama', 'A moment of stillness', 'Pause quietly on a permitted path, then make a peaceful landscape memory.', 'Respect worship and leave the mound and vegetation undisturbed.', 'leaf-outline', 'ramagrama'],
];

export const experienceQuests: Quest[] = challenges.map(([id, area, title, instruction, care, icon, place], index) => ({
  id: `experience-${area}-${id}`, title, subtitle: instruction, description: instruction,
  intention: 'Try something meaningful here and keep your own memory.',
  category: 'monastic', difficulty: 'easy', estimatedMinutes: 5, icon,
  tasks: [{ id: `experience-${area}-${id}-photo`, title, description: instruction, safetyNote: care, type: 'observation', evidence: 'photo', photoMode: 'creative', targetId: place }],
  createdAt: 1789200000000 + index,
}));

export function areaForQuest(quest: Quest): QuestArea | undefined {
  return questAreas.find((area) => quest.id.startsWith(`experience-${area.id}-`) || quest.tasks.some((task) => {
    const siteId = task.targetId && (findSite(task.targetId)?.id ?? findVantage(task.targetId)?.siteId);
    return !!siteId && area.siteIds.includes(siteId);
  }));
}

export function isVantageTask(task: Quest['tasks'][number]): boolean {
  return task.autoComplete === 'vantage_capture';
}

export function nearbyQuestAreas(coordinate: Coordinate | null, quests: QuestWithProgress[]) {
  if (!coordinate) return [];
  const ranked = questAreas.map((area) => ({
    ...area,
    distanceM: Math.min(distanceMeters(coordinate, area.coordinate), ...area.siteIds.flatMap((id) => {
      const site = findSite(id);
      return site ? [distanceMeters(coordinate, site.coordinate)] : [];
    })),
    quests: quests.filter((q) => areaForQuest(q)?.id === area.id),
  })).sort((a, b) => a.distanceM - b.distanceM);
  const nearby = ranked.filter((area) => area.distanceM <= 5_000);
  return nearby.length ? nearby : ranked.slice(0, 1);
}
