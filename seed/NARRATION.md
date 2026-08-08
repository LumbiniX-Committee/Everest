# Narration — production guide

`seed/narration.json` holds the spoken narration for all twelve sites, in
English and Nepali. It is written for the **ear**, not the eye — shorter
sentences and no parentheticals than the on-screen `summary` in `sites.json`, so
it sounds like someone talking beside you rather than a label being read out.

## Turning it into audio

**Pre-generate every clip as a bundled asset. Never run live text-to-speech at a
venue** — no network, no latency, no surprises on stage (09-PITCH §5).

### The generator

`tools/make-narration-audio.ps1` reads this manifest and writes
`<site-id>.<lang>.opus` into `app/assets/audio/` for you:

```powershell
powershell -File tools/make-narration-audio.ps1 -Lang en
powershell -File tools/make-narration-audio.ps1 -Lang ne   # needs a Nepali voice installed
```

It picks the best installed voice for the language and pipes through the ffmpeg
Opus command below. **The Windows SAPI voices it falls back to (David/Zira) are
robotic placeholders** — they prove the pipeline and make the player demoable
offline, but they are git-ignored and must be replaced with a good neural voice
before any real demo. There is no Nepali SAPI voice, so the `ne` track cannot be
generated this way at all — use a neural Nepali TTS for it.

1. Synthesize each `en` and `ne` string with a good TTS voice. Use a Nepali
   voice for the `ne` track — an English voice reading Devanagari is worse than
   no audio.
2. Name each file `<site-id>.<lang>.<ext>`, e.g. `maya-devi-temple.en.opus`,
   `maya-devi-temple.ne.opus`.
3. Compress to Opus (small, and fine for speech):

   ```bash
   ffmpeg -i maya-devi-temple.en.wav -c:a libopus -b:a 24k maya-devi-temple.en.opus
   ```

4. Drop the files in `app/assets/audio/`. The site-detail player (Person A
   Phase 2.5) plays `<site-id>.<lang>` and the en/ne switch picks the track.

`approx_seconds` in the manifest is a rough length so the UI can show a duration
before playback and so total asset size is predictable (~5–6 minutes of speech
per language across all twelve sites).

## Before it ships

Every `ne` string is `ne_review: "pending"`. A native Nepali speaker must read
each one and flip it to `"human"` — the credibility claim ("proper Nepali, not
machine translation") is only true after that pass. Listen to each synthesized
Nepali clip end to end; TTS mispronunciations of proper nouns (Puskarini,
Mahapajapati, Nipponzan-Myohoji) are common and jarring.

## Vocabulary

The narration is content, so it is covered by the full vocabulary sweep
(`node tools/lint-vocab.mjs`). Keep it in the register the rest of the copy uses:
darśana, puṇya, dāna, pradakṣiṇā — never the gamification lexicon.
