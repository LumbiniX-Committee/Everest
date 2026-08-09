# Sākṣī multilingual AI and offline plan

## Decision

Nepali remains a first-class language. English is the internal pivot language
for retrieval and small offline-model synthesis when a model does not reliably
generate Nepali. Citations, source IDs, Pali text, place names, and evidence
are never machine-translated.

The product has four independent language settings:

- `uiLanguage`: buttons, navigation, onboarding, settings.
- `inputLanguage`: typed or spoken user input.
- `outputLanguage`: answer and reflection language.
- `sourceLanguage`: canonical corpus language, normally English/Pali.

Initial supported languages are English (`en`) and Nepali (`ne`). The contract
is extensible to tourist languages without changing the Dhamma API shape.

## Online path

```text
app input
  -> HTTPS Sākṣī API
  -> safety and language detection
  -> translate input to English when required
  -> canonical hybrid retrieval
  -> Ollama Cloud synthesis with exact citation IDs
  -> validate citations
  -> return the model's requested-language answer plus original evidence/citations
```

No translation billing account is required for the current release. The
Ollama model receives the requested output language directly. A future server
translation provider may be added behind the same boundary, but it is not part
of the current deployment path.

The API contract should carry:

```json
{
  "question": "...",
  "inputLanguage": "ne",
  "outputLanguage": "ne",
  "mode": "auto"
}
```

The response carries `language`, `translationUsed`, `citations`, and
`passages`. Citation validation happens before translation and the exact
citation list is returned separately from translated prose.

## Offline path

Offline is a graceful capability ladder, not a second source of truth:

1. Local canonical corpus and deterministic retrieval always work.
2. Curated English/Nepali answers cover the demo and common site questions.
3. The optional Qwen3 GGUF model provides short on-device English/Nepali
   synthesis after it has been downloaded by the user.
4. If the model is missing, the deterministic corpus remains the source of
   truth; the local model may rewrite only retrieved passages and may not
   invent Dhamma facts or citations.

The selected first model is `Qwen3-0.6B-Q4_K_M.gguf` (about 484 MB). It is a
small multilingual baseline, not a Nepali-quality guarantee. It is loaded by
the `llama.rn` native `llama.cpp` bridge in a development/production build,
never in Expo Go. The app uses a short context and releases the model after
generation when memory is constrained.

Model delivery is optional and versioned. The app downloads over Wi-Fi to
app-private storage, validates the expected payload size, and exposes deletion
through the model service. The base APK does not force every user to download
a large model. The developer artifact and its SHA-256 are recorded in
`models/README.md`.

## Voice

Voice remains a separate system capability:

- system on-device speech recognition for English/Nepali where language packs
  exist;
- `expo-speech` for system TTS;
- clear typed-input fallback when a device lacks a language pack;
- no custom ASR/TTS model in the first deployment.

The language setting is passed to speech recognition and TTS independently of
the LLM or translation provider.

## Evaluation gates

Every release is tested with the same question set in English and Nepali:

- 20 in-scope Dhamma questions;
- 10 out-of-scope/refusal questions;
- 10 reflection prompts;
- citation preservation after translation;
- no-network fallback;
- missing-language-model behavior;
- English/Nepali UI and voice availability.

The release is not accepted if translation changes a citation ID, turns a
refusal into an answer, or presents an offline model's unsupported claim as
canonical evidence.

## Deployment environments

| Environment | AI | Translation | Mobile target |
|---|---|---|---|
| Local | Ollama Cloud through mock API | optional server key | Expo Go/dev client |
| Preview | hosted API + Ollama Cloud | Ollama requested-language output | internal APK |
| Production | hosted HTTPS API | Ollama requested-language output | store/production build |

`OLLAMA_API_KEY` is server-only. Only
`EXPO_PUBLIC_API_URL` and publishable Supabase configuration may be embedded in
the app bundle.
