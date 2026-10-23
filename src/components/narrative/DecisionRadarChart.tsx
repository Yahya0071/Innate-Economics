import React, { useMemo } from 'react';

export interface RadarDimension {
  key: string;
  label: string;
  score: number; // 0 to 100
  color?: string;
}

export interface DecisionRadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
  className?: string;
  showLabels?: boolean;
}

export function DecisionRadarChart({
  dimensions,
  size = 280,
  className = '',
  showLabels = true,
}: DecisionRadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.72;
  const numAxes = dimensions.length;

  // Calculate polygon vertices
  const polygonPoints = useMemo(() => {
    return dimensions.map((dim, i) => {
      // Angle starting from top (-PI / 2)
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
      const normalizedScore = Math.max(10, Math.min(100, dim.score)) / 100;
      const r = radius * normalizedScore;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, angle, label: dim.label, score: dim.score };
    });
  }, [dimensions, radius, center, numAxes]);

  // Points string for SVG polygon
  const pointsString = polygonPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Concentric background rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible select-none"
      >
        <defs>
          <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Guide Webs */}
        {rings.map((ringFactor, rIdx) => {
          const ringPoints = Array.from({ length: numAxes })
            .map((_, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
              const r = radius * ringFactor;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(' ');

          return (
            <polygon
              key={rIdx}
              points={ringPoints}
              fill="none"
              stroke="#334155"
              strokeWidth={rIdx === rings.length - 1 ? 1.5 : 1}
              strokeDasharray={rIdx === rings.length - 1 ? undefined : '3,3'}
              opacity={0.6}
            />
          );
        })}

        {/* Axis Spokes from Center */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
          const endX = center + radius * Math.cos(angle);
          const endY = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="#334155"
              strokeWidth={1}
              opacity={0.8}
            />
          );
        })}

        {/* Filled Data Polygon */}
        <polygon
          points={pointsString}
          fill="url(#radarGrad)"
          stroke="#f59e0b"
          strokeWidth={2.5}
          filter="url(#glow)"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Dots & Score Tooltips */}
        {polygonPoints.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4.5}
              fill="#fef08a"
              stroke="#b45309"
              strokeWidth={2}
              className="hover:scale-125 transition-transform"
            />
          </g>
        ))}

        {/* Axis Labels Around Perimeter */}
        {showLabels &&
          polygonPoints.map((p, idx) => {
            const labelDist = radius + 22;
            const lx = center + labelDist * Math.cos(p.angle);
            const ly = center + labelDist * Math.sin(p.angle);

            // Alignment adjustments based on horizontal position
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (Math.cos(p.angle) > 0.3) textAnchor = 'start';
            else if (Math.cos(p.angle) < -0.3) textAnchor = 'end';

            return (
              <text
                key={idx}
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="fill-slate-300 text-[10px] font-sans font-medium"
              >
                {p.label} ({p.score}%)
              </text>
            );
          })}
      </svg>
    </div>
  );
}
