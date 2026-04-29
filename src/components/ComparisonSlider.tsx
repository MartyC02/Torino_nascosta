import { useState, useRef, MouseEvent, TouchEvent } from "react";

interface ComparisonSliderProps {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ComparisonSlider({
  before,
  after,
  beforeAlt = "Immagine prima",
  afterAlt = "Immagine dopo",
  beforeLabel = "Prima",
  afterLabel = "Dopo",
}: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const percent = ((x - rect.left) / rect.width) * 100;

    setPosition(Math.min(Math.max(percent, 0), 100));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/10] select-none overflow-hidden group cursor-ew-resize border-b border-border-color bg-gray-100"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e)}
      onTouchMove={handleMove}
      onMouseDown={handleMove}
    >
      {/* After image */}
      <img
        src={after}
        alt={afterAlt}
        draggable="false"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Before image */}
      <img
        src={before}
        alt={beforeAlt}
        draggable="false"
        className="absolute inset-0 w-full h-full object-cover grayscale select-none pointer-events-none"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      />

      {/* Labels */}
      <span className="absolute top-4 left-4 z-30 bg-black/60 text-white px-3 py-1 text-[10px] uppercase tracking-widest font-bold backdrop-blur-sm">
        {beforeLabel}
      </span>

      <span className="absolute top-4 right-4 z-30 bg-accent-gold text-white px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
        {afterLabel}
      </span>

      {/* Divider */}
      <div
        className="absolute inset-y-0 z-20 w-1 bg-accent-gold pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center shadow-xl ring-4 ring-sidebar-bg/20">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-white" />
            <div className="w-0.5 h-3 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}