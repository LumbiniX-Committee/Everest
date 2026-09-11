import {
  createEvidenceObject,
  isDuplicateStorageUpload,
} from '@/services/supabase/evidence-storage';

describe('immutable evidence storage', () => {
  it('always creates without overwrite', async () => {
    const upload = jest.fn().mockResolvedValue({ error: null });
    const body = new ArrayBuffer(2);

    await createEvidenceObject(upload, 'site/observation.jpg', body, 'image/jpeg');

    expect(upload).toHaveBeenCalledWith('site/observation.jpg', body, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  });

  it('recognises a 409 or duplicate message as an already-completed retry', async () => {
    expect(isDuplicateStorageUpload({ statusCode: 409, message: 'Conflict' })).toBe(true);
    const upload = jest.fn().mockResolvedValue({
      error: { message: 'The resource already exists' },
    });

    await expect(
      createEvidenceObject(upload, 'site/observation.jpg', new ArrayBuffer(0), 'image/jpeg'),
    ).resolves.toBeUndefined();
  });

  it('does not hide unrelated upload failures', async () => {
    const error = { statusCode: 503, message: 'Storage unavailable' };
    const upload = jest.fn().mockResolvedValue({ error });

    await expect(
      createEvidenceObject(upload, 'site/observation.jpg', new ArrayBuffer(0), 'image/jpeg'),
    ).rejects.toBe(error);
  });
});
