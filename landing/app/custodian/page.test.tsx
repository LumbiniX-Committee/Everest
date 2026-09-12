import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  getReports: vi.fn(),
  getSites: vi.fn(),
  recordReportAction: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: api.routerPush }) }));
vi.mock('@/lib/custodianApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/custodianApi')>();
  return {
    ...original,
    getDashboard: api.getDashboard,
    getReports: api.getReports,
    getSites: api.getSites,
    recordReportAction: api.recordReportAction,
  };
});

import CustodianDashboard from './page';

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  api.getSites.mockResolvedValue([{ id: 'manga-hiti', name: { en: 'Manga Hiti', ne: 'मङ्ग हिति' } }]);
  api.getReports.mockResolvedValue({
    nextCursor: null,
    items: [{
      id: 'report-1', capture_id: 'capture-1', site_id: 'manga-hiti', category: 'water flow',
      subtype: null, severity: 'medium', note: 'Reduced flow', status: 'open', custodian_note: null,
      status_changed_at: null, created_at: '2026-09-01T00:00:00Z',
    }],
  });
  api.getDashboard.mockResolvedValue({
    window: { from: '2026-06-01T00:00:00Z', to: '2026-09-01T00:00:00Z' },
    coverage_pct: 50, vantages_total: 2, vantages_surveyed: 1, captures_total: 3,
    median_align_score: 0.8, reports_by_status: { open: 1, acknowledged: 0, in_progress: 0, resolved: 0 },
    median_first_response_hours: null, median_resolution_hours: null,
    commitments_overdue: 1, commitments_due_soon: 2,
    commitments: [{
      id: 'commitment-1', vantage_id: 'manga-hiti.v1', owner_kind: 'school',
      public_label: 'Patan class', next_due_at: '2026-08-01T00:00:00Z', due_state: 'overdue',
    }],
    vantages: [{ id: 'manga-hiti.v1', site_id: 'manga-hiti', urgent: false }],
    trend: [{ at: '2026-09-01T00:00:00Z', coverage_pct: 50, open_reports: 1 }],
    per_site: [{
      site_id: 'manga-hiti', captures: 3, coverage_pct: 50, open_reports: 1,
      trend: [{ at: '2026-09-01T00:00:00Z', coverage_pct: 50, open_reports: 1 }],
    }],
    generated_at: '2026-09-01T00:00:00Z',
  });
  api.recordReportAction.mockResolvedValue({});
});

describe('custodian portal', () => {
  it('renders authorized metrics, filters and the legal action', async () => {
    render(<CustodianDashboard />);
    expect((await screen.findAllByText('Manga Hiti')).length).toBeGreaterThan(0);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolved' })).not.toBeInTheDocument();
    expect(screen.getByText(/1 overdue/)).toBeInTheDocument();
  });

  it('records an action without asking the client for an actor identity', async () => {
    render(<CustodianDashboard />);
    fireEvent.change(await screen.findByPlaceholderText('Note (optional)'), { target: { value: 'Reviewed on site' } });
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    await waitFor(() => expect(api.recordReportAction).toHaveBeenCalledWith({
      reportId: 'report-1', status: 'acknowledged', note: 'Reviewed on site',
    }));
  });
});
