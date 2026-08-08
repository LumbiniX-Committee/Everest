/**
 * Camera service.
 *
 * Capture is driven by a `CameraView` ref rather than an imperative module, so
 * this file holds the settings and the post-capture contract instead of a
 * wrapper around the native call. Keeping the options here means the capture
 * screen and any future batch/retake flow photograph identically — a
 * time-series is only comparable if the exposure pipeline does not drift.
 */

export type CaptureOptions = {
  /** 0–1. High, because these images are an archival record. */
  quality: number;
  /** We never want base64 in memory for a full-resolution photograph. */
  base64: false;
  /** EXIF is part of the record: device, orientation, timestamp. */
  exif: true;
  /** The preview is mirrored for selfies; the record must not be. */
  mirror: false;
};

export const OBSERVATION_CAPTURE: CaptureOptions = {
  quality: 0.9,
  base64: false,
  exif: true,
  mirror: false,
};

/** What a capture must produce before it can become an Observation. */
export type CaptureResult = {
  uri: string;
  width: number;
  height: number;
  exif?: Record<string, unknown>;
};
