
import { useState, useRef, useEffect } from 'react';

interface UseSidebarLayoutOptions {
  breakpoint?: number;
  columnBreakpoint?: number;
}

interface UseSidebarLayoutReturn {
  isTwoColumn: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook to handle sidebar layout responsiveness
 * @param options Configuration options
 * @param options.breakpoint Breakpoint for mobile/desktop switch in pixels
 * @param options.columnBreakpoint Breakpoint for switching to two columns in pixels
 * @returns Object with layout state and refs
 */
export function useSidebarLayout(options: UseSidebarLayoutOptions = {}): UseSidebarLayoutReturn {
  const { 
    columnBreakpoint = 620 // Reduced from 700 to trigger two columns more easily
  } = options;
  
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Check if there's enough space for two columns
        if (entry.contentRect.width > columnBreakpoint) {
          setIsTwoColumn(true);
        } else {
          setIsTwoColumn(false);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [columnBreakpoint]);

  return {
    isTwoColumn,
    containerRef
  };
}
