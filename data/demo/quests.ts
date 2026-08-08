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
        targetId: 'maya-devi-temple',
      },
      {
        id: 'task-sg-2',
        title: 'Capture East Approach Vantage',
        description: 'Record baseline photo observation from vantage maya-devi-east-approach.',
        type: 'observation',
        targetId: 'maya-devi-east-approach',
      },
      {
        id: 'task-sg-3',
        title: 'Capture Pond Edge Vantage',
        description: 'Record baseline photo observation from vantage maya-devi-pond-edge.',
        type: 'observation',
        targetId: 'maya-devi-pond-edge',
      },
      {
        id: 'task-sg-4',
        title: 'File Foundation Condition Assessment',
        description: 'File a structural condition report on brick foundations.',
        type: 'condition_report',
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
        targetId: 'ashoka-pillar',
      },
      {
        id: 'task-ae-2',
        title: 'Capture Inscription Facing Vantage',
        description: 'Photograph the Brahmi epigraph from vantage ashoka-pillar-south.',
        type: 'observation',
        targetId: 'ashoka-pillar-south',
      },
      {
        id: 'task-ae-3',
        title: 'Study Brahmi Text Transcription',
        description: 'Review the classical Brahmi text translation and provenance details.',
        type: 'reading',
        targetId: 'rummindei-inscription',
      },
      {
        id: 'task-ae-4',
        title: 'Report Pillar Fissure Condition',
        description: 'Assess micro-fissure stability along the pillar shaft.',
        type: 'condition_report',
        targetId: 'ashoka-pillar',
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
        targetId: 'puskarini-pond',
      },
      {
        id: 'task-pw-2',
        title: 'Capture Water Surface Vantage',
        description: 'Record photo observation of pond water level and clarity.',
        type: 'observation',
        targetId: 'puskarini-pond-north',
      },
      {
        id: 'task-pw-3',
        title: 'Assess Masonry Step Algae & Erosion',
        description: 'Document sub-surface brick weathering and algal growth.',
        type: 'condition_report',
        targetId: 'puskarini-pond',
      },
    ],
    createdAt: 1770540000000,
  },
  {
    id: 'quest-monastic-zone-walk',
    title: 'Monastic Zone Conservation Walk',
    subtitle: 'Traverse the East and West Monastic Zones to document structural preservation',
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
        title: 'Survey Royal Thai Monastery',
        description: 'Visit and inspect exterior architectural state of Royal Thai Monastery.',
        type: 'site_visit',
        targetId: 'royal-thai-monastery',
      },
      {
        id: 'task-mz-2',
        title: 'Survey Mahamevnawa Monastery',
        description: 'Inspect courtyard brickwork and drainage at Mahamevnawa.',
        type: 'site_visit',
        targetId: 'mahamevnawa-monastery',
      },
      {
        id: 'task-mz-3',
        title: 'Capture Central Canal Alignment Vantage',
        description: 'Photograph central canal axis from the pedestrian bridge.',
        type: 'observation',
        targetId: 'monastic-canal-bridge',
      },
      {
        id: 'task-mz-4',
        title: 'File Monastic Zone Preservation Summary',
        description: 'Document overall visitor pathways and vegetation encroaching on structures.',
        type: 'condition_report',
        targetId: 'monastic-zone',
      },
    ],
    createdAt: 1770540000000,
  },
];
