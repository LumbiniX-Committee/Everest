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

import { hybridRetrieve, type RetrievalResult } from './retrieval.ts';
import { validateCitations, type Citation, type Passage } from './engine.ts';

export type ReflectionRequest = {
  site_id?: string;
  stage?: number; // 1 to 4
  user_input?: string;
  language?: 'en' | 'ne';
  answers?: string[];
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
  language?: 'en' | 'ne';
  guidance?: string;
  citations?: Citation[];
  passages?: Passage[];
  tier?: 'full_rag' | 'fallback';
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

const DEFAULT_STAGES_NE = [
  'आज तपाईंलाई सबैभन्दा भारी लागिरहेको कुरा के हो? त्यसलाई स्पष्ट रूपमा नाम दिनुहोस्।',
  'त्यो भारीपनको आधारमा कुन चाहना, विरोध, वा धारणा देखिन्छ?',
  'यदि यो समस्या केही समयका लागि नरहेको भए, त्यो अवस्था कस्तो देखिन्थ्यो?',
  'तपाईंले रोज्न सक्ने एउटा सानो, ठोस अर्को कदम के हो?',
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

const SITE_PROMPTS_NE: Record<string, string> = {
  puskarini: 'तपाईं एउटा जीवन सुरु भएको भनिएको ठाउँमा बसिरहनुभएको छ। सुरुवातसँगै कुनै कुराको अन्त्य पनि हुन्छ।',
  'maya-devi-temple': 'मानिसहरू संसारभरिबाट केही क्षण यहाँ उभिन आउँछन्।',
  'ashokan-pillar': 'कहिल्यै युद्ध गरेको एक सम्राट यहाँ उभिएर आफूभन्दा लामो समय टिक्ने चिनो छोडे।',
  'marker-stone': 'धेरै वर्षको ध्यानपूर्वक अवलोकनपछि मात्र यो स्थान निश्चित गरिएको थियो।',
  'vihara-remains': 'यहाँका अवशेषहरूले बनाइएका सबै कुरा परिवर्तन र क्षयतर्फ जाने कुरा सम्झाउँछन्।',
  tilaurakot: 'यो सिद्धार्थ हुर्किएको र छोडेर गएको नगर हो। यस ठाउँले शान्त प्रश्न सोध्छ।',
};

export function processReflection(req: ReflectionRequest): ReflectionResponse {
  const disclaimer = 'This is a reflective inquiry tool. It is not counselling, therapy, or mental health treatment.';
  const language = req.language ?? 'en';
  const stages = language === 'ne' ? DEFAULT_STAGES_NE : DEFAULT_STAGES;
  const sitePrompts = language === 'ne' ? SITE_PROMPTS_NE : SITE_PROMPTS;

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
      language,
    };
  }

  // 2. Normal Socratic Reflection Scaffold
  const currentStage = req.stage ?? 1;

  if (currentStage === 1 && req.site_id && sitePrompts[req.site_id]) {
    return {
      inquiry: `${sitePrompts[req.site_id]}\n\n${stages[0]}`,
      stage: 1,
      completed: false,
      distress_override: false,
      site_id: req.site_id,
      disclaimer,
      language,
    };
  }

  const nextStageIndex = Math.min(currentStage - 1, DEFAULT_STAGES.length - 1);
  // Stage 4 is the fourth question; completion happens only after its answer
  // is submitted and the stage-5 synthesis is requested.
  const isFinal = currentStage > 4;

  return {
    inquiry: stages[nextStageIndex],
    stage: currentStage,
    completed: isFinal,
    distress_override: false,
    site_id: req.site_id,
    disclaimer,
    language,
  };
}

function reflectionPassages(matches: RetrievalResult[]): Passage[] {
  return matches.map((match) => ({
    segment_id: match.chunk.chunk_id,
    pali: match.chunk.pali,
    english: match.chunk.english,
    translator: match.chunk.translator,
    collection: match.chunk.collection.toUpperCase(),
    licence: match.chunk.license,
  }));
}

function fallbackGuidance(language: 'en' | 'ne', matches: RetrievalResult[]): string {
  const citation = matches[0]?.chunk.chunk_id ? ` [${matches[0].chunk.chunk_id}]` : '';
  if (language === 'ne') {
    return `तपाईंले लेख्नुभएको कुरालाई तुरुन्तै समाधान गर्नुपर्ने आदेश होइन, ध्यानपूर्वक हेर्नुपर्ने अनुभवका रूपमा लिनुहोस्${citation}। आज एउटा सानो कदम रोज्नुहोस्: प्रतिक्रिया दिनुअघि केही सास हेर्नुहोस्, आफ्नो चाहना वा विरोधलाई नाम दिनुहोस्, र त्यसपछि तपाईंको मूल्यसँग मिल्ने काम गर्नुहोस्। यो सुझावलाई आफ्नै अनुभवमा जाँच्नुहोस्; यसलाई उपचार वा निश्चित जीवन-सल्लाह नठान्नुहोस्।`;
  }
  return `Treat what you wrote as an experience to observe, not a command that must be solved immediately${citation}. Choose one small step today: notice a breath before reacting, name the craving or aversion you saw, and then act in a way that fits your values. Test this against your own experience; it is not treatment or a definitive life prescription.`;
}

/**
 * Completes the four-question reflection with a short, grounded synthesis.
 * The user answers are used only for this request and are not written to the
 * server audit log. Distress is checked before any provider call.
 */
export async function processReflectionAsync(req: ReflectionRequest): Promise<ReflectionResponse> {
  const language = req.language ?? 'en';
  const answers = req.answers ?? [];
  if ([...(req.user_input ? [req.user_input] : []), ...answers].some(checkDistressTrigger)) {
    return processReflection({ ...req, language, user_input: req.user_input ?? answers.at(-1) });
  }

  if ((req.stage ?? 1) < 5) return processReflection({ ...req, language });

  const query = `${answers.join(' ')} dukkha craving aversion attachment mindfulness path`;
  const matches = hybridRetrieve(query, 4);
  const validMatches = matches.length > 0 ? matches : hybridRetrieve('four noble truths suffering craving path', 4);
  const finalPassages = reflectionPassages(validMatches);
  const disclaimer = language === 'ne'
    ? 'यो आत्म-चिन्तनको साधन हो; परामर्श, थेरापी वा मानसिक स्वास्थ्य उपचार होइन।'
    : 'This is a reflective inquiry tool. It is not counselling, therapy, or mental health treatment.';

  const fallback = {
    inquiry: fallbackGuidance(language, validMatches),
    stage: 5,
    completed: true,
    distress_override: false,
    site_id: req.site_id,
    disclaimer,
    language,
    guidance: fallbackGuidance(language, validMatches),
    citations: validMatches.length > 0 ? validateCitations(fallbackGuidance(language, validMatches), validMatches) : [],
    passages: finalPassages,
    tier: 'fallback' as const,
  };

  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey || validMatches.length === 0) return fallback;

  const context = validMatches.map((match) =>
    `[${match.chunk.chunk_id}] (${match.chunk.title_en}): "${match.chunk.english}"`,
  ).join('\n');
  const responseLanguage = language === 'ne' ? 'Nepali in Devanagari script' : 'English';
  const system = `You are a careful Buddhist reflection companion. Respond entirely in ${responseLanguage}. Do not claim to be the Buddha, do not diagnose, predict, moralise, or give medical/legal/financial advice. Reflect the user's four answers in 2-4 warm, concrete sentences. Offer one small experiment the user can choose, not an order. Use only the retrieved canonical passages and include at least one exact citation such as [sn56.11:4.2]. Say that the user should test the teaching against their own experience.`;
  const user = `Four reflections:\n${answers.map((answer, index) => `${index + 1}. ${answer}`).join('\n')}\n\nRetrieved canonical passages:\n${context}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(process.env.OLLAMA_API_ENDPOINT || 'https://ollama.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          stream: false,
          max_tokens: 320,
        }),
        signal: controller.signal,
      });
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const guidance = data.choices?.[0]?.message?.content?.trim();
      const citations = guidance ? validateCitations(guidance, validMatches) : [];
      if (response.ok && guidance && citations.length > 0) {
        return { ...fallback, inquiry: guidance, guidance, citations, tier: 'full_rag' };
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // The deterministic reflection remains safe and cited when the provider fails.
  }
  return fallback;
}
