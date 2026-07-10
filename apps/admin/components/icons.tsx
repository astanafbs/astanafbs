type IconName = 'archive' | 'edit' | 'external' | 'eyeOff' | 'open' | 'publish' | 'trash';

const paths: Record<IconName, string> = {
  archive: 'M5 4h10l4 4v12H5V4zM15 4v5h5M8 13h8M8 17h5',
  edit: 'M4 17.5V21h3.5L18.2 10.3l-3.5-3.5L4 17.5zM13.6 7.9l3.5 3.5M15.2 5.4l3.4 3.4',
  external: 'M14 4h6v6M13 11l7-7M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5',
  eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.4 9.4 0 0 1 12 5c5 0 8.5 4.2 9.5 7-0.3 0.8-1 1.9-2 3M6.4 6.4C4.5 7.7 3.2 9.7 2.5 12c1 2.8 4.5 7 9.5 7 1.5 0 2.8-0.4 4-1',
  open: 'M5 12h12M13 6l6 6-6 6',
  publish: 'M20 6L9 17l-5-5',
  trash: 'M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v5M14 11v5',
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden="true" className="action-svg" fill="none" viewBox="0 0 24 24">
      <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function IconButton({
  icon,
  label,
  tone,
  type = 'button',
}: {
  icon: IconName;
  label: string;
  tone?: 'danger' | 'success' | 'warning';
  type?: 'button' | 'submit';
}) {
  return (
    <button className={`icon-button action-icon${tone ? ` ${tone}` : ''}`} type={type} aria-label={label} title={label}>
      <Icon name={icon} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
