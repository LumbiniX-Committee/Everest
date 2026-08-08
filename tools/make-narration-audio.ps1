# tools/make-narration-audio.ps1
#
# Renders seed/narration.json to bundled opus clips in app/assets/audio/,
# following seed/NARRATION.md: pre-generate every clip, never live TTS.
#
#   powershell -File tools/make-narration-audio.ps1            # English track
#   powershell -File tools/make-narration-audio.ps1 -Lang ne   # Nepali (needs a ne voice)
#
# The Windows SAPI voices (David/Zira) are ROBOTIC PLACEHOLDERS. They prove the
# pipeline and make the player demoable offline, but must be replaced with a good
# neural voice before any real demo. The ne track needs a genuine Nepali voice;
# an English voice reading Devanagari is worse than no audio (see NARRATION.md).

param([string]$Lang = "en")

$ErrorActionPreference = "Stop"
$root  = Split-Path $PSScriptRoot -Parent
$json  = Join-Path $root "seed/narration.json"
$outdir = Join-Path $root "app/assets/audio"
New-Item -ItemType Directory -Force -Path $outdir | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name.StartsWith($Lang) } | Select-Object -First 1
if ($null -eq $voice) {
    Write-Warning "no installed voice for '$Lang' - using default. For 'ne' this means DO NOT SHIP the output."
} else {
    $synth.SelectVoice($voice.VoiceInfo.Name)
}
Write-Host "voice:" $synth.Voice.Name

$entries = Get-Content $json -Raw | ConvertFrom-Json
foreach ($e in $entries) {
    $text = $e.$Lang
    if ([string]::IsNullOrWhiteSpace($text)) { continue }
    $wav  = Join-Path $outdir ("{0}.{1}.wav"  -f $e.site_id, $Lang)
    $opus = Join-Path $outdir ("{0}.{1}.opus" -f $e.site_id, $Lang)
    $synth.SetOutputToWaveFile($wav)
    $synth.Speak($text)
    $synth.SetOutputToNull()
    & ffmpeg -y -loglevel error -i $wav -c:a libopus -b:a 24k $opus
    Remove-Item $wav
    Write-Host ("  wrote {0}" -f (Split-Path $opus -Leaf))
}
Write-Host "done - $Lang track in app/assets/audio/"
