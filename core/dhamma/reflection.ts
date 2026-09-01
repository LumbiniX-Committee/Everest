/**
 * core/dhamma/reflection.ts
 *
 * Reflection companion engine — inquiry, not advice.
 *
 * "Reflection on place": a four-question arc (name the difficulty, see where
 * it comes from, sense whether it could ease, choose one small step) asked
 * standing somewhere that matters, without religious framing — so the same
 * mechanism that shipped as a Buddhist Four-Truths scaffold at Lumbini also
 * works at a site with no Buddhist association. See
 * 15-POST-HACKATHON-STRATEGY §5. Incorporates site-aware prompts (Puskarini,
 * Ashokan Pillar, Tilaurakot, etc.). Includes mandatory Distress Override:
 * halting generation immediately and returning verified Nepali crisis numbers
 * on self-harm / crisis detection.
 */

import { hybridRetrieve, type RetrievalResult } from './retrieval.ts';
import { validateCitations, type Citation, type Passage } from './engine.ts';
import { callLlm, hasProvider, trimToCompleteSentence } from './llm.ts';

const REFLECTION_DISCLAIMER_EN =
  'This is a reflective inquiry tool. It is not counselling, therapy, or mental health treatment.';
const REFLECTION_DISCLAIMER_NE =
  'यो आत्म-चिन्तनको साधन हो; परामर्श, थेरापी वा मानसिक स्वास्थ्य उपचार होइन।';

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

export type ReflectionQuestionsRequest = {
  user_input: string;
  language?: 'en' | 'ne';
  site_id?: string;
};

export type ReflectionQuestionsResponse = {
  /** A short, tailored opening line, or a site prompt in the deterministic case. */
  opening?: string;
  /** 3–4 inquiry questions: tailored to the input online, deterministic offline. */
  questions: string[];
  distress_override: boolean;
  helplines?: CrisisHelpline[];
  disclaimer: string;
  language: 'en' | 'ne';
  /** 'full_rag' when the provider tailored them; 'fallback' when deterministic. */
  tier: 'full_rag' | 'fallback';
  site_id?: string;
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
  'patan-durbar-square': 'Kings built this square to be looked at forever. It is still being repaired from an earthquake ten years ago.',
  'changu-narayan': 'A king recorded his own reign in stone here, fifteen hundred years ago. The stone has outlasted the reign by a long way.',
  'manga-hiti': 'Water has run through this stone spout since before most of what stands nearby was built. Not all of it still runs.',
};

const SITE_PROMPTS_NE: Record<string, string> = {
  puskarini: 'तपाईं एउटा जीवन सुरु भएको भनिएको ठाउँमा बसिरहनुभएको छ। सुरुवातसँगै कुनै कुराको अन्त्य पनि हुन्छ।',
  'maya-devi-temple': 'मानिसहरू संसारभरिबाट केही क्षण यहाँ उभिन आउँछन्।',
  'ashokan-pillar': 'कहिल्यै युद्ध गरेको एक सम्राट यहाँ उभिएर आफूभन्दा लामो समय टिक्ने चिनो छोडे।',
  'marker-stone': 'धेरै वर्षको ध्यानपूर्वक अवलोकनपछि मात्र यो स्थान निश्चित गरिएको थियो।',
  'vihara-remains': 'यहाँका अवशेषहरूले बनाइएका सबै कुरा परिवर्तन र क्षयतर्फ जाने कुरा सम्झाउँछन्।',
  tilaurakot: 'यो सिद्धार्थ हुर्किएको र छोडेर गएको नगर हो। यस ठाउँले शान्त प्रश्न सोध्छ।',
  'patan-durbar-square': 'राजाहरूले यो चोक सधैंभरि हेरिने बनाए। दश वर्षअघिको भूकम्पबाट यो अझै मर्मत भइरहेको छ।',
  'changu-narayan': 'एक राजाले आफ्नो शासनकाल ढुङ्गामा कुँदेर यहाँ लेखे, पन्ध्रसय वर्षअघि। त्यो ढुङ्गा उनको शासनभन्दा धेरै लामो समय टिक्यो।',
  'manga-hiti': 'यो ढुङ्गे धाराबाट नजिकैका धेरै संरचना बन्नुअघिदेखि नै पानी बगेको छ। अहिले सबै त्यसरी बगिरहेको छैन।',
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

/**
 * Parse the model's reply into 3–4 clean inquiry questions, or null if it did
 * not return a usable set.
 *
 * The model is asked for a bare JSON array, but providers wrap it in prose or a
 * code fence often enough that we extract the first bracketed span rather than
 * trusting the whole reply to be JSON. Anything malformed, too short, or too
 * long is rejected wholesale — a half-parsed set is worse than the deterministic
 * fallback, which is known-good. Pure, so the parsing is unit-tested without a
 * provider.
 */
export function parseGeneratedQuestions(raw: string, min = 3, max = 4): string[] | null {
  if (!raw) return null;
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const questions = parsed
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && item.length <= 200);
  if (questions.length < min) return null;
  return questions.slice(0, max);
}

/**
 * Turn what the person shared into 3–4 questions tailored to their words.
 *
 * Online, one provider call rewrites the Four-Truths scaffold around what they
 * actually said — naming the difficulty, seeing its origin, sensing it could
 * ease, choosing one small step — as questions, never answers. The reply is
 * parsed and validated; anything unusable falls through.
 *
 * Offline, or on any provider or validation failure, it returns the deterministic
 * four-question scaffold unchanged. That fallback is the reflection companion
 * that shipped before this, so the feature degrades to a known-good version
 * rather than to nothing — which is the case Lumbini actually presents.
 *
 * Distress is checked first, before any provider call, and short-circuits to the
 * crisis response with verified helplines.
 */
export async function generateReflectionQuestions(
  req: ReflectionQuestionsRequest,
): Promise<ReflectionQuestionsResponse> {
  const language = req.language ?? 'en';
  const disclaimer = language === 'ne' ? REFLECTION_DISCLAIMER_NE : REFLECTION_DISCLAIMER_EN;
  const input = (req.user_input ?? '').trim();

  if (input && checkDistressTrigger(input)) {
    return {
      questions: [],
      distress_override: true,
      helplines: VERIFIED_NEPALI_HELPLINES,
      disclaimer,
      language,
      tier: 'fallback',
      site_id: req.site_id,
    };
  }

  const sitePrompts = language === 'ne' ? SITE_PROMPTS_NE : SITE_PROMPTS;
  const opening = req.site_id ? sitePrompts[req.site_id] : undefined;
  const fallbackQuestions = language === 'ne' ? DEFAULT_STAGES_NE : DEFAULT_STAGES;
  const fallback: ReflectionQuestionsResponse = {
    opening,
    questions: [...fallbackQuestions],
    distress_override: false,
    disclaimer,
    language,
    tier: 'fallback',
    site_id: req.site_id,
  };

  if (!hasProvider() || !input) return fallback;

  const responseLanguage = language === 'ne' ? 'Nepali in Devanagari script' : 'English';
  // Reflection on place, not doctrine: the four-question arc (name the
  // difficulty, see where it comes from, sense whether it could ease, choose
  // one small step) is the mechanism worth keeping — it does not need a
  // Buddhist label to work, and a label would not survive the reflection
  // companion running at a non-Buddhist site. See
  // 15-POST-HACKATHON-STRATEGY §5.
  const system =
    'You are a careful reflection companion at a place of historical or cultural significance. The ' +
    'person will share what is on their mind. Generate exactly 4 short questions, in this order: one ' +
    'naming the difficulty as they experience it, one asking where it seems to come from, one asking ' +
    'whether they can picture it easing even a little, and one asking for a single small next step. ' +
    'Tailor every question to their words. Ask, do not answer. Give no advice, no diagnosis, no ' +
    'moralising, and never claim to be a religious or historical figure or any kind of teacher. Each ' +
    'question must be answerable by the person in their own words. ' +
    `Respond entirely in ${responseLanguage}. Output ONLY a JSON array of 4 strings and nothing else.`;
  const user = `The person shared:\n"""${input}"""`;

  // Generous headroom: a reasoning model consumes much of its budget before it
  // writes anything, and a JSON array cut off at the limit fails to parse and
  // costs the whole tailored set. Over-allocating is cheaper than falling back.
  const reply = await callLlm(system, user, 900);
  // No sentence-trimming rescue for this one: a severed JSON array is not
  // repairable, and `parseGeneratedQuestions` already returns null on malformed
  // input, which lands on the deterministic scaffold.
  const questions = reply ? parseGeneratedQuestions(reply.text, 3, 4) : null;
  if (questions && questions.length >= 3) {
    return {
      opening,
      questions,
      distress_override: false,
      disclaimer,
      language,
      tier: 'full_rag',
      site_id: req.site_id,
    };
  }
  return fallback;
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
    return `तपाईंले ${focus} लाई चार प्रश्नमार्फत हेर्नुभयो${citation}। यसको अर्थ तपाईं कमजोर हुनुहुन्छ भन्ने होइन; अनुभवका कारण र त्यसप्रतिको प्रतिक्रियालाई छुट्याएर हेर्न सकिन्छ। आज एउटा सानो प्रयोग गर्नुहोस्: ${steps[variation]}। यसलाई आफ्नै अनुभवमा जाँच्नुहोस्; यसलाई उपचार वा निश्चित जीवन-सल्लाह नठान्नुहोस्।`;
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
  return `You looked at ${focusEn} through four questions${citation}. This does not mean something is wrong with you; it means the experience and your response to it can be seen separately. Try one small experiment today: ${stepsEn[variation]}. Test this against your own experience; it is not treatment or a definitive life prescription.`;
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

  // Not anchored to Pali vocabulary any more: a reflection completed at a
  // heritage site should be free to close on a heritage citation, not forced
  // toward the Pali canon regardless of where the conversation happened. The
  // last-resort fallback below still guarantees a non-empty result — it
  // matches an intent route in both corpora — for the case where a person's
  // own words share no vocabulary with either.
  const query = `${req.site_id ?? ''} ${answers.join(' ')} change impermanence meaning`.trim();
  const matches = hybridRetrieve(query, 4);
  const validMatches = matches.length > 0 ? matches : hybridRetrieve('impermanence change monument reconstruction', 4);
  const finalPassages = reflectionPassages(validMatches);
  const disclaimer = language === 'ne'
    ? 'यो आत्म-चिन्तनको साधन हो; परामर्श, थेरापी वा मानसिक स्वास्थ्य उपचार होइन।'
    : 'This is a reflective inquiry tool. It is not counselling, therapy, or mental health treatment.';

  // Computed once. It was being built three separate times — twice for the two
  // fields and again to validate against — and since it is deterministic all
  // three agreed, so nothing broke; it was simply the same paragraph assembled
  // three times on every completed reflection.
  const deterministic = fallbackGuidance(language, validMatches, answers);
  const fallback = {
    inquiry: deterministic,
    stage: 5,
    completed: true,
    distress_override: false,
    site_id: req.site_id,
    disclaimer,
    language,
    guidance: deterministic,
    citations: validMatches.length > 0 ? validateCitations(deterministic, validMatches) : [],
    passages: finalPassages,
    tier: 'fallback' as const,
  };

  if (!hasProvider() || validMatches.length === 0) return fallback;

  const context = validMatches.map((match) =>
    `[${match.chunk.chunk_id}] (${match.chunk.title_en}): "${match.chunk.english}"`,
  ).join('\n');
  const responseLanguage = language === 'ne' ? 'Nepali in Devanagari script' : 'English';
  const system = `You are a careful reflection companion at a place of historical or cultural significance. Respond entirely in ${responseLanguage}. Do not claim to be a religious or historical figure, do not diagnose, predict, moralise, or give medical/legal/financial advice. Reflect the user's own answers back in 2-4 warm, concrete sentences. Offer one small experiment the user can choose, not an order. Use only the retrieved passages and include at least one exact citation such as [sn56.11:4.2] or [venice-1964:art9]. Say that the user should test this against their own experience.`;
  const user = `The person's reflections:\n${answers.map((answer, index) => `${index + 1}. ${answer}`).join('\n')}\n\nRetrieved canonical passages:\n${context}`;

  // Through `callLlm`, not a second hand-rolled fetch. This path used to shape
  // its own request with its own timeout and its own token ceiling, which is the
  // precise drift `llm.ts` was extracted to end — and it is how this call came to
  // be capped so low that it rendered replies which stopped mid-sentence.
  const reply = await callLlm(system, user, 900);
  if (!reply) return fallback;

  // A reply that hit the ceiling is cut back to its last complete sentence
  // rather than shown as-is. Guidance that ends mid-word reads as a broken app
  // on the one surface that has to look trustworthy.
  const guidance = reply.truncated ? trimToCompleteSentence(reply.text) : reply.text;

  // Both gates matter, and both fall back rather than degrade in place:
  // too-short means trimming left nothing usable, and no citation means the
  // model wrote something the retrieved passages do not support. The
  // deterministic reflection is grounded and cited, so falling back is a
  // downgrade in tailoring only, never in honesty.
  const citations = guidance.length >= 40 ? validateCitations(guidance, validMatches) : [];
  if (citations.length > 0) {
    return { ...fallback, inquiry: guidance, guidance, citations, tier: 'full_rag' };
  }
  return fallback;
}
