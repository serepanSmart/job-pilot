'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { usePathname } from 'next/navigation';
import { tokens } from '@/theme/tokens';

const NAV = [
  { href: '/', label: 'Inbox' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/stats', label: 'Stats' },
] as const;

export function NavLinks() {
  const pathname = usePathname();

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1 }}>
      {NAV.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Button
            key={item.href}
            href={item.href}
            variant="text"
            size="small"
            sx={{
              color: active ? tokens.primary.light : 'text.secondary',
              position: 'relative',
              '&::after': active
                ? {
                    content: '""',
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 16,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: tokens.primary.light,
                  }
                : {},
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  );
}
NavLinks.displayName = 'NavLinks';
