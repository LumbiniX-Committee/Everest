import * as FileSystem from 'expo-file-system';

import { countMyRecords, deleteMyRecords, exportMyRecords } from '@/services/privacy';
import * as database from '@/services/database';
import * as device from '@/services/device';
import { forgetIdentity } from '@/services/supabase/auth';

jest.mock('@/services/database', () => ({
  countObservations: jest.fn(),
  listObservations: jest.fn(),
  listConditionReports: jest.fn(),
  listEveryQuestSubmission: jest.fn(),
  listMeritEvents: jest.fn(),
  listSiteVisits: jest.fn(),
  listQuestCompletions: jest.fn(),
  wipeAllPersonalRecords: jest.fn(),
}));

jest.mock('@/services/device', () => ({
  peekDeviceId: jest.fn(),
  forgetDeviceId: jest.fn(),
}));

jest.mock('@/services/supabase/auth', () => ({
  forgetIdentity: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

const mockedDatabase = database as jest.Mocked<typeof database>;
const mockedDevice = device as jest.Mocked<typeof device>;
const mockedForgetIdentity = forgetIdentity as jest.Mock;
const mockedDeleteAsync = FileSystem.deleteAsync as jest.Mock;

describe('services/privacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('counts records by delegating to the observation count', async () => {
    mockedDatabase.countObservations.mockResolvedValue(7);
    await expect(countMyRecords()).resolves.toBe(7);
  });

  it('bundles every record type this device holds, tagged with when and whose device', async () => {
    mockedDevice.peekDeviceId.mockResolvedValue('device-123');
    mockedDatabase.listObservations.mockResolvedValue([{ id: 'obs-1' } as never]);
    mockedDatabase.listConditionReports.mockResolvedValue([{ id: 'report-1' } as never]);
    mockedDatabase.listEveryQuestSubmission.mockResolvedValue([{ questId: 'q1', taskId: 't1' } as never]);
    mockedDatabase.listMeritEvents.mockResolvedValue([{ id: 'merit-1' } as never]);
    mockedDatabase.listSiteVisits.mockResolvedValue([{ siteId: 'site-1' } as never]);
    mockedDatabase.listQuestCompletions.mockResolvedValue([{ id: 'completion-1' } as never]);

    const bundle = await exportMyRecords();

    expect(bundle.deviceId).toBe('device-123');
    expect(bundle.observations).toEqual([{ id: 'obs-1' }]);
    expect(bundle.conditionReports).toEqual([{ id: 'report-1' }]);
    expect(bundle.questSubmissions).toEqual([{ questId: 'q1', taskId: 't1' }]);
    expect(bundle.meritEvents).toEqual([{ id: 'merit-1' }]);
    expect(bundle.siteVisits).toEqual([{ siteId: 'site-1' }]);
    expect(bundle.questCompletions).toEqual([{ id: 'completion-1' }]);
    expect(new Date(bundle.exportedAt).toISOString()).toBe(bundle.exportedAt);
  });

  it('deletes local photos and forgets the device identity after wiping the database', async () => {
    mockedDatabase.wipeAllPersonalRecords.mockResolvedValue({
      observationPhotoUris: ['file:///obs-1.jpg'],
      questSubmissionPhotoUris: ['file:///quest-1.jpg'],
    });

    await deleteMyRecords();

    expect(mockedDatabase.wipeAllPersonalRecords).toHaveBeenCalledTimes(1);
    expect(mockedDeleteAsync).toHaveBeenCalledWith('file:///obs-1.jpg', { idempotent: true });
    expect(mockedDeleteAsync).toHaveBeenCalledWith('file:///quest-1.jpg', { idempotent: true });
    expect(mockedDevice.forgetDeviceId).toHaveBeenCalledTimes(1);
    expect(mockedForgetIdentity).toHaveBeenCalledTimes(1);

    // The database rows are gone before the identifiers are forgotten, per
    // services/privacy's own ordering rationale: a failure while forgetting
    // the device id must never strand personal rows still on disk.
    const wipeOrder = mockedDatabase.wipeAllPersonalRecords.mock.invocationCallOrder[0];
    const forgetOrder = mockedDevice.forgetDeviceId.mock.invocationCallOrder[0];
    expect(wipeOrder).toBeLessThan(forgetOrder);
  });

  it('still forgets the device identity even when a photo file fails to delete', async () => {
    mockedDatabase.wipeAllPersonalRecords.mockResolvedValue({
      observationPhotoUris: ['file:///missing.jpg'],
      questSubmissionPhotoUris: [],
    });
    mockedDeleteAsync.mockRejectedValueOnce(new Error('file not found'));

    await expect(deleteMyRecords()).resolves.toBeUndefined();

    expect(mockedDevice.forgetDeviceId).toHaveBeenCalledTimes(1);
    expect(mockedForgetIdentity).toHaveBeenCalledTimes(1);
  });
});
