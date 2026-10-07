'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export function Icon({
  name,
  size = 22,
  filled,
  className,
  style,
}: {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden="true" className={'icon' + (filled ? ' filled' : '') + (className ? ' ' + className : '')} style={{ fontSize: size, ...style }}>
      {name}
    </span>
  );
}

export function TopBar({ label, onBack, style }: { label?: string; onBack: () => void; style?: CSSProperties }) {
  return (
    <div className="topbar" style={style}>
      <button type="button" className="icon-btn" onClick={onBack} aria-label="Tilbake">
        <Icon name="arrow_back" size={24} />
      </button>
      {label && <span className="topbar-label">{label}</span>}
    </div>
  );
}

export function SwitchRow({
  label,
  sub,
  on,
  onToggle,
  disabled,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" role="switch" aria-checked={on} className="row-btn switch-row" onClick={onToggle} disabled={disabled}>
      <span className="row-text">
        <span className="switch-label">{label}</span>
        {sub && <span className="row-sub">{sub}</span>}
      </span>
      <span className={'switch' + (on ? ' on' : '')}>
        <span className="switch-knob" />
      </span>
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="note">{hint}</span>}
    </label>
  );
}

export function ChevronRow({
  title,
  sub,
  onClick,
  large,
  arrow = 'chevron_right',
}: {
  title: string;
  sub?: string;
  onClick: () => void;
  large?: boolean;
  arrow?: 'chevron_right' | 'arrow_forward';
}) {
  return (
    <button type="button" className={'row-btn ' + (large ? 'choice-row-lg' : 'choice-row')} onClick={onClick}>
      <span className="row-text" style={{ gap: 3 }}>
        <span className="row-title">{title}</span>
        {sub && <span className="row-sub">{sub}</span>}
      </span>
      <Icon name={arrow} style={{ color: arrow === 'arrow_forward' ? 'var(--accent-ink)' : 'var(--muted)' }} />
    </button>
  );
}

export function RadioOptions<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | null | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" className="options">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} className={'option' + (on ? ' on' : '')} onClick={() => onChange(o.value)}>
            <span className={'radio-dot' + (on ? ' on' : '')} />
            <span style={{ flex: 1 }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="checkbox" onClick={onToggle}>
      <span className="checkbox-box">{checked && <span className="checkbox-tick">✓</span>}</span>
      <span>{children}</span>
    </button>
  );
}

export function Tabs<T extends string>({
  value,
  items,
  onChange,
  className,
  style,
}: {
  value: T;
  items: [T, string][];
  onChange: (v: T) => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div role="tablist" className={'tabs' + (className ? ' ' + className : '')} style={style}>
      {items.map(([k, label]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} className="tab" onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function DateCol({ date, accent }: { date: string; accent?: boolean }) {
  const d = new Date(date + 'T12:00');
  const wk = d.toLocaleDateString('nb-NO', { weekday: 'short' }).replace('.', '');
  const mon = d.toLocaleDateString('nb-NO', { month: 'short' }).replace('.', '');
  return (
    <span className={'datecol' + (accent ? ' accent' : '')}>
      <span className="datecol-small">{wk}</span>
      <span className="datecol-day">{d.getDate()}</span>
      <span className="datecol-small">{mon}</span>
    </span>
  );
}

export function KeyValues({ rows, style }: { rows: [string, ReactNode][]; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', ...style }}>
      {rows.map(([k, v]) => (
        <div key={k} className="kv">
          <span className="kv-key">{k}</span>
          <span className="kv-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

const INK = '#1d1214';

/** Finger/mouse signature. Always white so the ink shows in dark mode too. */
export function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (dataUrl: string | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Restore a saved signature once when the pad mounts.
  const initial = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || !initial.current) return;
    const ctx = el.getContext('2d')!;
    const im = new Image();
    im.onload = () => ctx.drawImage(im, 0, 0, el.width, el.height);
    im.src = initial.current;
  }, []);

  useEffect(() => {
    if (value) return;
    const el = ref.current;
    el?.getContext('2d')!.clearRect(0, 0, el.width, el.height);
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = el.getContext('2d')!;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    let drawing = false;
    let last: [number, number] = [0, 0];
    const pt = (e: PointerEvent): [number, number] => {
      const r = el.getBoundingClientRect();
      return [((e.clientX - r.left) * el.width) / r.width, ((e.clientY - r.top) * el.height) / r.height];
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      drawing = true;
      last = pt(e);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      ctx.beginPath();
      ctx.arc(last[0], last[1], 2.2, 0, Math.PI * 2);
      ctx.fillStyle = INK;
      ctx.fill();
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const p = pt(e);
      ctx.beginPath();
      ctx.moveTo(last[0], last[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      last = p;
    };
    const up = () => {
      if (!drawing) return;
      drawing = false;
      onChangeRef.current(el.toDataURL('image/png'));
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', up);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="section-head">
        <span className="field-label">{label}</span>
        {value && (
          <button type="button" className="link-btn small" onClick={() => onChange(null)}>
            Tøm
          </button>
        )}
      </div>
      <div className="sig">
        <canvas ref={ref} width={900} height={300} aria-label="Signaturfelt" />
        <span className="sig-line" />
      </div>
      <span className="note" style={{ fontSize: 13 }}>
        Skriv signaturen din med fingeren eller musa.
      </span>
    </div>
  );
}
