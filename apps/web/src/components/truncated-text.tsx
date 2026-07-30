'use client';

import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';
import { useCallback, useState } from 'react';

type Props = Omit<
  TypographyProps,
  'children' | 'ref' | 'noWrap' | 'component'
> & {
  readonly text: string;
};

export function TruncatedText({ text, ...typographyProps }: Props) {
  const [truncated, setTruncated] = useState(false);

  const measure = useCallback(
    (node: HTMLElement | null) => {
      if (node === null) {
        return undefined;
      }

      const check = () => {
        setTruncated(node.scrollWidth > node.clientWidth);
      };

      check();
      const observer = new ResizeObserver(check);
      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    },
    // `text` is not read inside this callback but forces re-attachment so the element is re-measured when the string changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text]
  );

  return (
    <Tooltip title={truncated ? text : ''} enterDelay={400} placement="top">
      <Typography component="div" {...typographyProps} ref={measure} noWrap>
        {text}
      </Typography>
    </Tooltip>
  );
}
TruncatedText.displayName = 'TruncatedText';
