import { findSite, findVantage } from '../generated/sites';
import type { Quest } from '@/types';

export const demoQuests: Quest[] = [
  {
    id: 'quest-sacred-garden-survey',
    title: 'Sacred Garden Foundation Survey',
    subtitle: 'Survey key vantages in the central sacred precinct surrounding Maya Devi Temple',
    description:
      'Conduct a systematic baseline photograph survey of the central excavation area, recording physical preservation state from established eastern and southern vantages.',
    category: 'survey',
    difficulty: 'easy',
    intention:
      'A baseline is only useful if someone returns to it. What you record here\n       is the frame the next survey will be measured against.',
    estimatedMinutes: 20,
    icon: 'compass-outline',
    tasks: [
      {
        id: 'task-sg-1',
        title: 'Visit Maya Devi Temple Precinct',
        description: 'Arrive at the main precinct of the Maya Devi shelter.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'maya-devi-temple',
      },
      {
        id: 'task-sg-2',
        title: 'Capture East Approach Vantage',
        description: 'Record baseline photo observation from the east-side vantage, facing west.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Record baseline photo observation from the east-side vantage, facing west.',
        targetId: 'maya-devi-temple.v2',
      },
      {
        id: 'task-sg-3',
        title: 'Capture Pond Edge Vantage',
        description: 'Record baseline photo observation from the south approach, facing north.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Record baseline photo observation from the south approach, facing north.',
        targetId: 'maya-devi-temple.v1',
      },
      {
        id: 'task-sg-4',
        title: 'File Foundation Condition Assessment',
        description: 'File a structural condition report on brick foundations.',
        type: 'condition_report',
        evidence: 'photo',
        expectation: 'File a structural condition report on brick foundations.',
        targetId: 'maya-devi-temple',
      },
    ],
    createdAt: 1770540000000,
  },
  {
    id: 'quest-ashokan-epigraphy',
    title: 'Ashokan Pillar Epigraphy & Preservation',
    subtitle: 'Inspect the 3rd-century BCE inscription and pillar shaft condition',
    description:
      "Examine Emperor Ashoka's Brahmi inscription erected in 249 BCE. Verify pillar surface integrity, lightning crack protection band, and surrounding iron fence perimeter.",
    category: 'epigraphy',
    difficulty: 'moderate',
    intention:
      'The inscription has outlasted every hand that tended it. Looking closely\n       at what threatens it is how that continues.',
    estimatedMinutes: 30,
    icon: 'book-open-outline',
    tasks: [
      {
        id: 'task-ae-1',
        title: 'Inspect Ashoka Pillar Site',
        description: 'Approach the Ashoka Pillar south perimeter.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'ashokan-pillar',
      },
      {
        id: 'task-ae-2',
        title: 'Capture Inscription Facing Vantage',
        description: 'Photograph the Brahmi epigraph from the south-west vantage, facing the inscription.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Photograph the Brahmi epigraph from the south-west vantage, facing the inscription.',
        targetId: 'ashokan-pillar.v1',
      },
      {
        id: 'task-ae-3',
        title: 'Study Brahmi Text Transcription',
        description: 'Review the classical Brahmi text translation and provenance details.',
        type: 'reading',
        evidence: 'note',
        targetId: 'ashokan-pillar.v2',
      },
      {
        id: 'task-ae-4',
        title: 'Report Pillar Fissure Condition',
        description: 'Assess micro-fissure stability along the pillar shaft.',
        type: 'condition_report',
        evidence: 'photo',
        expectation: 'Assess micro-fissure stability along the pillar shaft.',
        targetId: 'ashokan-pillar',
      },
    ],
    createdAt: 1770540000000,
  },
  {
    id: 'quest-puskarini-water-watch',
    title: 'Puskarini Pond Hydrology & Water Watch',
    subtitle: 'Monitor water quality, brick step erosion, and aquatic ecosystem state',
    description:
      'Track environmental parameters of the sacred bathing pond where Maya Devi bathed prior to giving birth. Observe water clarity, lotus growth, and masonry retaining wall condition.',
    category: 'ecology',
    difficulty: 'easy',
    intention:
      'Water damage is gradual, and gradual change is what attention is worst at\n       noticing. Recording it makes the slow visible.',
    estimatedMinutes: 15,
    icon: 'water-outline',
    tasks: [
      {
        id: 'task-pw-1',
        title: 'Walk Sacred Pond Steps',
        description: 'Survey the brick steps surrounding Puskarini Pond.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'puskarini',
      },
      {
        id: 'task-pw-2',
        title: 'Capture Water Surface Vantage',
        description: 'Record photo observation of pond water level and clarity.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Record photo observation of pond water level and clarity.',
        targetId: 'puskarini.v1',
      },
      {
        id: 'task-pw-3',
        title: 'Assess Masonry Step Algae & Erosion',
        description: 'Document sub-surface brick weathering and algal growth.',
        type: 'condition_report',
        evidence: 'photo',
        expectation: 'Document sub-surface brick weathering and algal growth.',
        targetId: 'puskarini',
      },
    ],
    createdAt: 1770540000000,
  },
  {
    id: 'quest-monastic-zone-walk',
    title: 'Monastic Zone Conservation Walk',
    subtitle: 'Traverse the east and west monastic precincts to document structural preservation',
    description:
      'Walk the Kenzo Tange master plan canal and examine international monastic architectural structures, assessing material conservation and visitor impact across monastic precincts.',
    category: 'monastic',
    difficulty: 'challenging',
    intention:
      'Walking the zone end to end shows what no single vantage does: how the\n       precincts wear differently, and where the wear is spreading.',
    estimatedMinutes: 45,
    icon: 'walk-outline',
    tasks: [
      {
        id: 'task-mz-1',
        title: 'Survey the Myanmar temple',
        description: 'Visit and inspect exterior architectural state of the Myanmar temple.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'myanmar-temple',
      },
      {
        id: 'task-mz-2',
        title: 'Survey the Gautami Nuns temple',
        description: 'Inspect courtyard brickwork and drainage in the nuns’ temple courtyard.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'gautami-nuns-temple',
      },
      {
        id: 'task-mz-3',
        title: 'Capture Central Canal Alignment Vantage',
        description: 'Photograph central canal axis from the pedestrian bridge.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Photograph central canal axis from the pedestrian bridge.',
        targetId: 'korean-temple',
      },
      {
        id: 'task-mz-4',
        title: 'File the China Temple Preservation Summary',
        description: 'Document overall visitor pathways and vegetation encroaching on structures.',
        type: 'condition_report',
        evidence: 'photo',
        expectation: 'Document overall visitor pathways and vegetation encroaching on structures.',
        targetId: 'china-temple',
      },
    ],
    createdAt: 1770540000000,
  },
  {
    id: 'quest-patan-durbar-survey',
    title: 'Patan Durbar Square Recovery Survey',
    subtitle: 'Record how the square looks eight years after its 2015 earthquake restoration',
    description:
      'Patan Durbar Square was fully restored in 2023, eight years after the April 2015 earthquake damaged it and brought down the Hari Shankar Temple. Record a dated baseline from two fixed vantages and file a note on what you see.',
    category: 'survey',
    difficulty: 'easy',
    intention:
      'Restoration finished in 2023, but nothing has watched the square since.\n       A dated photograph starts that record.',
    estimatedMinutes: 20,
    icon: 'compass-outline',
    tasks: [
      {
        id: 'task-pd-1',
        title: 'Visit Patan Durbar Square',
        description: 'Arrive at the Malla royal square.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'patan-durbar-square',
      },
      {
        id: 'task-pd-2',
        title: 'Capture South Approach Vantage',
        description: 'Record a baseline photo from the south approach, facing north.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Record a baseline photo from the south approach, facing north.',
        targetId: 'patan-durbar-square.v1',
      },
      {
        id: 'task-pd-3',
        title: 'Capture East Side Vantage',
        description: 'Record a baseline photo from the east side, facing west.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Record a baseline photo from the east side, facing west.',
        targetId: 'patan-durbar-square.v2',
      },
      {
        id: 'task-pd-4',
        title: 'File a Restoration Condition Note',
        description: 'Note the state of the square eight years after restoration.',
        type: 'condition_report',
        evidence: 'photo',
        expectation: 'Note the state of the square eight years after restoration.',
        targetId: 'patan-durbar-square',
      },
    ],
    createdAt: 1770540000000,
  },
  {
    id: 'quest-changu-narayan-record',
    title: 'Changu Narayan Reconstruction Record',
    subtitle: "Photograph the rebuilt temple and note the inscription's condition",
    description:
      "Changu Narayan was destroyed in the April 2015 earthquake and rebuilt, piece by piece, over the following five years. Record a dated baseline from two fixed vantages of the temple that now stands on Mānadeva's hilltop.",
    category: 'epigraphy',
    difficulty: 'moderate',
    intention:
      'The temple standing here now is a rebuild. What condition it holds in ten\n       years starts with what gets recorded now.',
    estimatedMinutes: 25,
    icon: 'book-open-outline',
    tasks: [
      {
        id: 'task-cn-1',
        title: 'Visit Changu Narayan',
        description: 'Arrive at the temple hilltop above the Manohara valley.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'changu-narayan',
      },
      {
        id: 'task-cn-2',
        title: 'Capture South Approach Vantage',
        description: 'Record a baseline photo from the south approach, facing north.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Record a baseline photo from the south approach, facing north.',
        targetId: 'changu-narayan.v1',
      },
      {
        id: 'task-cn-3',
        title: 'Capture East Side Vantage',
        description: 'Record a baseline photo from the east side, facing west.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Record a baseline photo from the east side, facing west.',
        targetId: 'changu-narayan.v2',
      },
      {
        id: 'task-cn-4',
        title: 'File a Post-Reconstruction Condition Note',
        description: 'Note the rebuilt structure’s condition, five years after reconstruction finished.',
        type: 'condition_report',
        evidence: 'photo',
        expectation: 'Note the rebuilt structure’s condition, five years after reconstruction finished.',
        targetId: 'changu-narayan',
      },
    ],
    createdAt: 1770540000000,
  },
  {
    id: 'quest-manga-hiti-flow-watch',
    title: 'Manga Hiti Flow Watch',
    subtitle: "Record whether one of the valley's oldest stone spouts is still running",
    description:
      "A 2019 survey found fewer than half of the Kathmandu Valley's dhunge dharas still produce water, and most are not checked on any schedule. Photograph Manga Hiti and note whether it is flowing.",
    category: 'ecology',
    difficulty: 'easy',
    intention:
      'Nobody watches most of these on any continuous schedule. One dated\n       photograph, with a note on whether water is running, adds to a record\n       that barely exists.',
    estimatedMinutes: 10,
    icon: 'water-outline',
    tasks: [
      {
        id: 'task-mh-1',
        title: 'Visit Manga Hiti',
        description: 'Arrive at the stone water spout at the southern corner of the square.',
        type: 'site_visit',
        evidence: 'none',
        targetId: 'manga-hiti',
      },
      {
        id: 'task-mh-2',
        title: 'Capture the Spout',
        description: 'Photograph the spout and note whether water is flowing.',
        type: 'observation',
        evidence: 'photo',
        expectation: 'Photograph the spout and note whether water is flowing.',
        targetId: 'manga-hiti.v1',
      },
      {
        id: 'task-mh-3',
        title: 'File a Flow Condition Note',
        description: 'Note whether the spout is flowing, and any visible deterioration.',
        type: 'condition_report',
        evidence: 'photo',
        expectation: 'Note whether the spout is flowing, and any visible deterioration.',
        targetId: 'manga-hiti',
      },
    ],
    createdAt: 1770540000000,
  },
];

/**
 * Which sites a quest is about.
 *
 * A task points at either a site or one of its vantages, so a quest's places
 * are the union of both once the vantages are resolved back to what they look
 * at. This is what makes the quest system location-aware: it decides which
 * quests are offered where, and which are shown locked.
 *
 * `services/integrity` checks every `targetId` resolves at startup. It did not
 * used to, and two of the four quests below pointed at site ids that had been
 * renamed — so they belonged to nowhere, were offered nowhere, and locked
 * nowhere.
 */
export function siteIdsForQuest(quest: Quest): string[] {
  const ids: string[] = [];
  for (const task of quest.tasks) {
    if (!task.targetId) continue;
    const siteId = findSite(task.targetId)
      ? task.targetId
      : findVantage(task.targetId)?.siteId;
    if (siteId && !ids.includes(siteId)) ids.push(siteId);
  }
  return ids;
}

/**
 * The quests belonging to a place, in catalogue order.
 *
 * Generic over the quest type so a caller holding `QuestWithProgress[]` gets
 * its progress back rather than a bare `Quest[]` — the screen that asks this
 * question is always the one that needs to know what is already done.
 */
export function questsForSite<T extends Quest>(siteId: string, quests: readonly T[]): T[];
export function questsForSite(siteId: string): Quest[];
export function questsForSite<T extends Quest>(
  siteId: string,
  quests: readonly T[] | readonly Quest[] = demoQuests,
): (T | Quest)[] {
  return quests.filter((quest) => siteIdsForQuest(quest).includes(siteId));
}

/** The place a quest is primarily about — the first site any of its tasks names. */
export function primarySiteForQuest(quest: Quest): string | undefined {
  return siteIdsForQuest(quest)[0];
}
