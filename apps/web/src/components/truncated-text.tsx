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

/**
 * Single-line text that ellipsises when it does not fit, and shows a tooltip
 * with the full string only in that case.
 *
 * Always renders as a block element: Typography emits a `<span>` for the
 * caption and inherit variants, and `overflow`/`text-overflow` have no effect
 * on inline elements — the text overflows and gets clipped by the parent
 * instead of ellipsising.
 */
export function TruncatedText({ text, ...typographyProps }: Props) {
  const [truncated, setTruncated] = useState(false);

  /**
   * A ref callback rather than an effect: measuring on attach is not a render
   * side effect, and setState here does not trip the cascading-render rule that
   * `setState` directly inside `useEffect` does. React 19 runs the returned
   * cleanup when the ref detaches.
   *
   * `text` is a dependency so the ref re-attaches and re-measures when the
   * string changes — ResizeObserver only fires on size changes, and swapping
   * text inside a fixed-width column does not resize the element.
   */
  const measure = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return undefined;

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
    // `text` is intentionally a dependency it does not read: changing it must
    // re-attach the ref so the element is measured again. exhaustive-deps only
    // reasons about values used *inside* the callback, so it cannot see that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text]
  );

  return (
    // An empty title renders no tooltip, so the element tree stays stable
    // instead of mounting and unmounting the Tooltip as the width changes.
    <Tooltip title={truncated ? text : ''} enterDelay={400} placement="top">
      <Typography component="div" {...typographyProps} ref={measure} noWrap>
        {text}
      </Typography>
    </Tooltip>
  );
}
