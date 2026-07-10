'use client';

import { useEffect, useId, useState } from 'react';

import { Icon } from './icons';

export function CreateModal({
  buttonLabel,
  title,
  children,
  buttonClassName,
  buttonIcon,
}: {
  buttonLabel: string;
  title: string;
  children: React.ReactNode;
  buttonClassName?: string;
  buttonIcon?: 'edit';
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const triggerClassName = buttonClassName ?? (buttonIcon ? 'icon-button action-icon' : 'button');

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button className={triggerClassName} type="button" aria-label={buttonLabel} title={buttonLabel} onClick={() => setOpen(true)}>
        {buttonIcon ? <Icon name={buttonIcon} /> : buttonLabel}
        {buttonIcon ? <span className="sr-only">{buttonLabel}</span> : null}
      </button>

      {open ? (
        <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button className="modal-backdrop" type="button" aria-label="Закрыть" onClick={() => setOpen(false)} />
          <section className="modal-panel">
            <div className="modal-header">
              <h2 id={titleId}>{title}</h2>
              <button className="icon-button" type="button" aria-label="Закрыть" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">{children}</div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function ConfirmModal({
  buttonLabel,
  title,
  message,
  children,
  buttonIcon = 'trash',
  danger = true,
}: {
  buttonLabel: string;
  title: string;
  message: string;
  children: React.ReactNode;
  buttonIcon?: 'archive' | 'edit' | 'external' | 'eyeOff' | 'open' | 'publish' | 'trash';
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button className={`icon-button action-icon${danger ? ' danger' : ''}`} type="button" aria-label={buttonLabel} title={buttonLabel} onClick={() => setOpen(true)}>
        <Icon name={buttonIcon} />
        <span className="sr-only">{buttonLabel}</span>
      </button>

      {open ? (
        <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button className="modal-backdrop" type="button" aria-label="Закрыть" onClick={() => setOpen(false)} />
          <section className="modal-panel confirm-panel">
            <div className="modal-header">
              <h2 id={titleId}>{title}</h2>
              <button className="icon-button action-icon" type="button" aria-label="Закрыть" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-copy">{message}</p>
              <div className="modal-confirm-actions">
                <button className="button secondary" type="button" onClick={() => setOpen(false)}>Отмена</button>
                {children}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
