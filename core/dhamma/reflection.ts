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
import { DHAMMA_MODEL, hasProvider, LLM_API_KEY, LLM_ENDPOINT, LLM_TIMEOUT_MS } from './llm.ts';

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

function fallbackGuidance(language: 'en' | 'ne', matches: RetrievalResult[], answers: string[] = []): string {
  const citation = matches[0]?.chunk.chunk_id ? ` [${matches[0].chunk.chunk_id}]` : '';
  const joined = answers.join(' ').toLowerCase();
  const focus = /तुलना|compare|comparison|jealous|jealousy/.test(joined)
    ? 'तुलना र आफूलाई अरूसँग नाप्ने बानी'
    : /क्रोध|रिस|anger|angry|resent/.test(joined)
      ? 'रिस र त्यसले देखाएको चोट'
      : /डर|भय|fear|anxious|चिन्ता|worry/.test(joined)
        ? 'डर र भविष्यलाई नियन्त्रण गर्न खोज्ने मन'
        : /काम|तनाव|work|stress|pressure/.test(joined)
          ? 'कामको दबाब र त्यससँग जोडिएको अपेक्षा'
          : /छोड|समात|attachment|attached|holding|craving/.test(joined)
            ? 'समातेर राख्न खोजेको चाहना'
            : 'तपाईंले नाम दिनुभएको भारी अनुभव';
  const variation = answers.reduce((sum, answer) => sum + answer.length, 0) % 3;
  if (language === 'ne') {
    const steps = [
      'प्रतिक्रिया दिनुअघि तीन सास हेर्नुहोस् र त्यस क्षणमा के चाहनुभएको थियो भनेर नाम दिनुहोस्',
      'आज एउटा त्यस्तो क्षण रोज्नुहोस् जहाँ तपाईंले तुरुन्तै प्रतिक्रिया दिनुहुन्छ; एक पल रोकिएर शरीर र मन दुवै अवलोकन गर्नुहोस्',
      'यो अनुभव फेरि आउँदा आफूलाई दोष नदिई, चाहना र विरोध दुवै परिवर्तनशील छन् कि छैनन् भनेर जाँच्नुहोस्',
    ];
    return `तपाईंले ${focus} लाई चार प्रश्नमार्फत हेर्नुभयो${citation}। यसको अर्थ तपाईं कमजोर हुनुहुन्छ भन्ने होइन; अनुभवका कारण र त्यसप्रतिको प्रतिक्रियालाई छुट्याएर हेर्न सकिन्छ। आज एउटा सानो प्रयोग गर्नुहोस्: ${steps[variation]}। यो शिक्षालाई आफ्नै अनुभवमा जाँच्नुहोस्; यसलाई उपचार वा निश्चित जीवन-सल्लाह नठान्नुहोस्।`;
  }
  const focusEn = /तुलना|compare|comparison|jealous|jealousy/.test(joined)
    ? 'comparison and the habit of measuring yourself against others'
    : /क्रोध|रिस|anger|angry|resent/.test(joined)
      ? 'anger and the hurt it may be protecting'
      : /डर|भय|fear|anxious|चिन्ता|worry/.test(joined)
        ? 'fear and the mind’s wish to control what comes next'
        : /काम|तनाव|work|stress|pressure/.test(joined)
          ? 'work pressure and the expectations attached to it'
          : /छोड|समात|attachment|attached|holding|craving/.test(joined)
            ? 'the wish to hold on to what is changing'
            : 'the heaviness you named';
  const stepsEn = [
    'notice three breaths before reacting, then name what you wanted in that moment',
    'choose one moment when you usually react quickly; pause and observe both body and mind',
    'when this experience returns, check whether the craving and aversion are changing rather than blaming yourself',
  ];
  return `You looked at ${focusEn} through four questions${citation}. This does not mean something is wrong with you; it means the experience and your response to it can be seen separately. Try one small experiment today: ${stepsEn[variation]}. Test the teaching against your own experience; it is not treatment or a definitive life prescription.`;
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
    inquiry: fallbackGuidance(language, validMatches, answers),
    stage: 5,
    completed: true,
    distress_override: false,
    site_id: req.site_id,
    disclaimer,
    language,
    guidance: fallbackGuidance(language, validMatches, answers),
    citations: validMatches.length > 0 ? validateCitations(fallbackGuidance(language, validMatches, answers), validMatches) : [],
    passages: finalPassages,
    tier: 'fallback' as const,
  };

  if (!hasProvider() || validMatches.length === 0) return fallback;

  const context = validMatches.map((match) =>
    `[${match.chunk.chunk_id}] (${match.chunk.title_en}): "${match.chunk.english}"`,
  ).join('\n');
  const responseLanguage = language === 'ne' ? 'Nepali in Devanagari script' : 'English';
  const system = `You are a careful Buddhist reflection companion. Respond entirely in ${responseLanguage}. Do not claim to be the Buddha, do not diagnose, predict, moralise, or give medical/legal/financial advice. Reflect the user's four answers in 2-4 warm, concrete sentences. Offer one small experiment the user can choose, not an order. Use only the retrieved canonical passages and include at least one exact citation such as [sn56.11:4.2]. Say that the user should test the teaching against their own experience.`;
  const user = `Four reflections:\n${answers.map((answer, index) => `${index + 1}. ${answer}`).join('\n')}\n\nRetrieved canonical passages:\n${context}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    try {
      const response = await fetch(LLM_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DHAMMA_MODEL,
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
