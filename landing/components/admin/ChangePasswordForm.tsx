'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react';

import { changePassword } from '@/lib/adminApi';
import { MIN_PASSWORD_LENGTH, checkNewPassword } from '@/lib/password-policy';

import { Notice, inputClass, primaryButton } from './ui';

/**
 * Change the signed-in account's password. The rules show as you type, the
 * server checks the current password and the rules again, and the session
 * stays signed in afterwards.
 */
export function ChangePasswordForm({ email }: { email: string | null }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const rules = [
    { ok: next.length >= MIN_PASSWORD_LENGTH, label: `At least ${MIN_PASSWORD_LENGTH} characters` },
    { ok: /[A-Za-z]/.test(next) && /[0-9]/.test(next), label: 'Letters and at least one number' },
    { ok: next.length > 0 && next !== current, label: 'Different from your current password' },
    { ok: confirm.length > 0 && confirm === next, label: 'Both new passwords match' },
  ];
  const policy = checkNewPassword(next, current, email);
  const ready = Boolean(current) && policy.ok && confirm === next;

  const type = show ? 'text' : 'password';

  return (
    <form
      className="max-w-md space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready || busy) return;
        setBusy(true);
        setNotice(null);
        changePassword({ current, next })
          .then(() => {
            setNotice({ kind: 'success', text: 'Password changed. Use the new one next time you sign in.' });
            setCurrent('');
            setNext('');
            setConfirm('');
          })
          .catch((error) => setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not change the password.' }))
          .finally(() => setBusy(false));
      }}
    >
      {/* Lets password managers file the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email ?? ''} readOnly hidden />
      <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
        Current password
        <input type={type} required autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
        New password
        <input type={type} required autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} aria-describedby="password-rules" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
        New password again
        <input type={type} required autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <button type="button" onClick={() => setShow((on) => !on)} className="inline-flex items-center gap-1.5 text-sm font-medium text-sandstone-deep">
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        {show ? 'Hide passwords' : 'Show passwords'}
      </button>

      <ul id="password-rules" className="space-y-1.5 text-sm" aria-live="polite">
        {rules.map((rule) => (
          <li key={rule.label} className={`flex items-center gap-2 ${rule.ok ? 'text-tirtha' : 'text-ink-muted'}`}>
            {rule.ok ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
            <span>{rule.label}</span>
            <span className="sr-only">{rule.ok ? '(met)' : '(not yet)'}</span>
          </li>
        ))}
      </ul>
      {next && !policy.ok && policy.problems.some((p) => p.startsWith('Not')) ? (
        <p className="text-sm text-robe">{policy.problems.filter((p) => p.startsWith('Not')).join(' ')}</p>
      ) : null}

      {notice ? <Notice kind={notice.kind}>{notice.text}</Notice> : null}
      <button className={primaryButton} disabled={!ready || busy}>
        {busy ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
        Change password
      </button>
    </form>
  );
}
