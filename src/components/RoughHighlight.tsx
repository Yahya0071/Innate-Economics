import React, { useEffect, useRef } from 'react';
import { annotate } from 'rough-notation';

interface RoughHighlightProps {
  children: React.ReactNode;
  type?: 'underline' | 'box' | 'circle' | 'highlight' | 'bracket';
  color?: string;
  strokeWidth?: number;
  padding?: number;
  animationDuration?: number;
  className?: string;
  multiline?: boolean;
}

export const RoughHighlight: React.FC<RoughHighlightProps> = ({
  children,
  type = 'underline',
  color = '#f59e0b',
  strokeWidth = 2,
  padding = 4,
  animationDuration = 800,
  className = '',
  multiline = true,
}) => {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const annotation = annotate(elementRef.current, {
      type,
      color,
      strokeWidth,
      padding,
      animationDuration,
      multiline,
      iterations: 2,
    });

    annotation.show();

    return () => {
      annotation.remove();
    };
  }, [type, color, strokeWidth, padding, animationDuration, multiline]);

  return (
    <span ref={elementRef} className={`inline-block relative font-semibold ${className}`}>
      {children}
    </span>
  );
};
