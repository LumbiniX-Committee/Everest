/**
 * core/dhamma/reflection.ts
 *
 * Reflection companion engine — inquiry, not advice.
 *
 * Follows the four-truths inquiry scaffold (Dukkha -> Origin -> Cessation -> Path).
 * Incorporates site-aware prompts (Puskarini, Ashokan Pillar, Tilaurakot, etc.).
 * Includes mandatory Distress Override: halting generation immediately and returning
 * verified Nepali crisis numbers on self-harm / crisis detection.
 */

export type ReflectionRequest = {
  site_id?: string;
  stage?: number; // 1 to 4
  user_input?: string;
  language?: 'en' | 'ne';
};

export type CrisisHelpline = {
  name: string;
  number: string;
  hours: string;
};

export type ReflectionResponse = {
  inquiry: string;
  stage: number;
  completed: boolean;
  distress_override: boolean;
  helplines?: CrisisHelpline[];
  site_id?: string;
  disclaimer: string;
};

export const VERIFIED_NEPALI_HELPLINES: CrisisHelpline[] = [
  {
    name: 'National Mental Health Helpline Nepal (TUTH)',
    number: '1660 01 20005',
    hours: '24/7 Toll-Free',
  },
  {
    name: 'Patan Hospital Crisis Helpline',
    number: '9813473763',
    hours: '24/7',
  },
  {
    name: 'Nepal Police Emergency Services',
    number: '100',
    hours: '24/7',
  },
];

const DISTRESS_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'kill yourself',
  'want to die',
  'end my life',
  'end their life',
  'harm myself',
  'self-harm',
  'no reason to live',
  'worthless life',
  'आत्महत्या',
  'मर्न चाहन्छु',
  'जिन्दगी सिध्याउने',
  'मर्न मन लाग्छ',
];

/** Detects crisis triggers in user input */
export function checkDistressTrigger(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return DISTRESS_KEYWORDS.some((kw) => lower.includes(kw));
}

const DEFAULT_STAGES = [
  'What are you carrying today that feels heavy?',
  'Where does that heaviness seem to come from?',
  'Can you picture setting even a little of it down?',
  'What is one small step you could take next?',
];

/** Site-specific opening prompts */
const SITE_PROMPTS: Record<string, string> = {
  puskarini: 'You are sitting where a life is said to have begun. Beginnings are also endings of something else.',
  'maya-devi-temple': 'This is a place people travel across the world to stand in for a moment.',
  'ashokan-pillar': 'An emperor who once waged war stood here and left a mark meant to outlast him. It has.',
  'marker-stone': 'It took a century of careful looking to fix this one spot with certainty.',
  'vihara-remains': 'Stupas recorded here in 1957 were gone by a later visit. Everything built is on its way to being ruins.',
  tilaurakot: 'This is the town Siddhartha grew up in and chose to leave. The place asks a quiet question.',
};

export function processReflection(req: ReflectionRequest): ReflectionResponse {
  const disclaimer = 'This is a reflective inquiry tool. It is not counselling, therapy, or mental health treatment.';

  // 1. Mandatory Safety & Distress Override Check
  if (req.user_input && checkDistressTrigger(req.user_input)) {
    return {
      inquiry: 'If you are experiencing acute distress or thoughts of self-harm, please reach out to dedicated support services immediately. You do not have to carry this alone.',
      stage: req.stage ?? 1,
      completed: true,
      distress_override: true,
      helplines: VERIFIED_NEPALI_HELPLINES,
      site_id: req.site_id,
      disclaimer,
    };
  }

  // 2. Normal Socratic Reflection Scaffold
  const currentStage = req.stage ?? 1;

  if (currentStage === 1 && req.site_id && SITE_PROMPTS[req.site_id]) {
    return {
      inquiry: `${SITE_PROMPTS[req.site_id]}\n\n${DEFAULT_STAGES[0]}`,
      stage: 1,
      completed: false,
      distress_override: false,
      site_id: req.site_id,
      disclaimer,
    };
  }

  const nextStageIndex = Math.min(currentStage - 1, DEFAULT_STAGES.length - 1);
  const isFinal = currentStage >= 4;

  return {
    inquiry: DEFAULT_STAGES[nextStageIndex],
    stage: currentStage,
    completed: isFinal,
    distress_override: false,
    site_id: req.site_id,
    disclaimer,
  };
}
