export type EvidenceStorageError = {
  message: string;
  statusCode?: string | number;
};

type UploadOptions = {
  contentType: string;
  upsert: false;
};

type UploadResult = Promise<{ error: EvidenceStorageError | null }>;

export type EvidenceObjectUploader = (
  path: string,
  body: ArrayBuffer,
  options: UploadOptions,
) => UploadResult;

/** A conflict means a previous attempt created this immutable object. */
export function isDuplicateStorageUpload(error: EvidenceStorageError): boolean {
  return (
    String(error.statusCode ?? '') === '409' ||
    /already exists|duplicate/i.test(error.message)
  );
}

/** Create evidence once. Retries reuse bytes already stored at the same path. */
export async function createEvidenceObject(
  upload: EvidenceObjectUploader,
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const { error } = await upload(path, body, { contentType, upsert: false });
  if (error && !isDuplicateStorageUpload(error)) throw error;
}
