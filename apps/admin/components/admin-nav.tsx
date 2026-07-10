'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNav({ items }: { items: Array<[string, string]> }) {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {items.map(([href, label]) => {
        const active = href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link className={active ? 'active' : undefined} href={href} key={href} aria-current={active ? 'page' : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
