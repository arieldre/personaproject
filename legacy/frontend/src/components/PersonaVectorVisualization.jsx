import React from 'react';
import {
  Brain,
  Target,
  Zap,
  Heart,
  MessageSquare,
  FileText,
  Crown,
  BookOpen,
  Shield,
  Compass,
  Star,
  Swords,
  BarChart3,
  Activity
} from 'lucide-react';

// Vector configuration with icons and colors
const VECTOR_CONFIG = {
  innovation: {
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    lowLabel: 'Traditional',
    highLabel: 'Innovative'
  },
  diligence: {
    icon: Target,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    lowLabel: 'Speed-focused',
    highLabel: 'Detail-oriented'
  },
  social_energy: {
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    lowLabel: 'Introverted',
    highLabel: 'Extroverted'
  },
  agreeableness: {
    icon: Heart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    lowLabel: 'Challenging',
    highLabel: 'Harmonious'
  },
  directness: {
    icon: MessageSquare,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    lowLabel: 'Diplomatic',
    highLabel: 'Direct'
  },
  verbosity: {
    icon: FileText,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    lowLabel: 'Concise',
    highLabel: 'Verbose'
  },
  formality: {
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    lowLabel: 'Casual',
    highLabel: 'Formal'
  },
  jargon_density: {
    icon: BookOpen,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    lowLabel: 'Plain language',
    highLabel: 'Jargon-heavy'
  },
  deference: {
    icon: Shield,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    lowLabel: 'Autonomous',
    highLabel: 'Deferential'
  },
  autonomy: {
    icon: Compass,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
    lowLabel: 'Supervised',
    highLabel: 'Self-directed'
  },
  sycophancy: {
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    lowLabel: 'Skeptical',
    highLabel: 'Flattering'
  },
  conflict_mode: {
    icon: Swords,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    lowLabel: 'Avoiding',
    highLabel: 'Competing'
  },
  decision_basis: {
    icon: BarChart3,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    lowLabel: 'Intuitive',
    highLabel: 'Analytical'
  },
  stress_resilience: {
    icon: Activity,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    lowLabel: 'Reactive',
    highLabel: 'Resilient'
  }
};

// Format vector name for display
function formatVectorName(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get intensity label
function getIntensityLabel(value) {
  const abs = Math.abs(value);
  if (abs >= 0.8) return 'Extreme';
  if (abs >= 0.5) return 'Strong';
  if (abs >= 0.25) return 'Moderate';
  return 'Neutral';
}

export default function PersonaVectorVisualization({ 
  vectors, 
  profile,
  showDetails = true,
  compact = false 
}) {
  if (!vectors) return null;

  const vectorEntries = Object.entries(vectors)
    .filter(([key]) => VECTOR_CONFIG[key])
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])); // Sort by absolute value

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {vectorEntries.slice(0, 5).map(([key, value]) => {
          const config = VECTOR_CONFIG[key];
          const Icon = config.icon;
          const isPositive = value >= 0;
          
          return (
            <div 
              key={key}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
                ${config.bgColor} ${config.color}
              `}
              title={`${formatVectorName(key)}: ${value.toFixed(2)}`}
            >
              <Icon className="w-3 h-3" />
              <span>{isPositive ? config.highLabel : config.lowLabel}</span>
            </div>
          );
        })}
        {vectorEntries.length > 5 && (
          <span className="text-xs text-gray-400 px-2 py-1">
            +{vectorEntries.length - 5} more
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Personality Vectors</h3>
      </div>

      {/* Vector Grid */}
      <div className="grid gap-3">
        {vectorEntries.map(([key, value]) => (
          <VectorBar 
            key={key}
            vectorKey={key}
            value={value}
            profile={profile?.[key]}
            showDetails={showDetails}
          />
        ))}
      </div>

      {/* Legend */}
      {showDetails && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>← Negative trait pole</span>
            <span>Neutral</span>
            <span>Positive trait pole →</span>
          </div>
        </div>
      )}
    </div>
  );
}

function VectorBar({ vectorKey, value, profile, showDetails }) {
  const config = VECTOR_CONFIG[vectorKey];
  if (!config) return null;

  const Icon = config.icon;
  const percentage = ((value + 1) / 2) * 100; // Convert [-1, 1] to [0, 100]
  const intensity = getIntensityLabel(value);
  const isPositive = value >= 0;

  return (
    <div className={`p-3 rounded-lg ${config.bgColor} border border-transparent hover:border-gray-200 transition-all`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-1.5 rounded-lg bg-white ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 text-sm">
              {formatVectorName(vectorKey)}
            </span>
            <span className={`text-sm font-mono ${config.color}`}>
              {value >= 0 ? '+' : ''}{value.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Bar visualization */}
      <div className="relative">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className="w-20 text-right truncate">{config.lowLabel}</span>
          <div className="flex-1 h-2 bg-white rounded-full overflow-hidden relative">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
            
            {/* Value indicator */}
            <div 
              className={`
                absolute top-0 bottom-0 rounded-full transition-all
                ${isPositive 
                  ? `left-1/2 bg-gradient-to-r from-gray-400 ${config.color.replace('text-', 'to-')}`
                  : `right-1/2 bg-gradient-to-l from-gray-400 ${config.color.replace('text-', 'to-')}`
                }
              `}
              style={{ 
                width: `${Math.abs(value) * 50}%`
              }}
            />
          </div>
          <span className="w-20 truncate">{config.highLabel}</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && profile && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className={`
            px-2 py-0.5 rounded-full bg-white 
            ${intensity === 'Extreme' ? 'text-red-600' :
              intensity === 'Strong' ? 'text-orange-600' :
              intensity === 'Moderate' ? 'text-yellow-600' :
              'text-gray-500'}
          `}>
            {intensity}
          </span>
          <span className="text-gray-500">
            {profile.description || (isPositive ? config.highLabel : config.lowLabel)}
          </span>
        </div>
      )}
    </div>
  );
}

// Radar chart alternative for overview
export function VectorRadar({ vectors, size = 200 }) {
  if (!vectors) return null;

  const vectorEntries = Object.entries(vectors)
    .filter(([key]) => VECTOR_CONFIG[key]);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size - 40) / 2;

  // Calculate points for polygon
  const points = vectorEntries.map(([, value], index) => {
    const angle = (index / vectorEntries.length) * 2 * Math.PI - Math.PI / 2;
    const normalizedValue = (value + 1) / 2; // 0 to 1
    const x = centerX + Math.cos(angle) * radius * normalizedValue;
    const y = centerY + Math.sin(angle) * radius * normalizedValue;
    return { x, y };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Background circles */}
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <circle
          key={r}
          cx={centerX}
          cy={centerY}
          r={radius * r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {vectorEntries.map(([key], index) => {
        const angle = (index / vectorEntries.length) * 2 * Math.PI - Math.PI / 2;
        const x2 = centerX + Math.cos(angle) * radius;
        const y2 = centerY + Math.sin(angle) * radius;
        return (
          <line
            key={key}
            x1={centerX}
            y1={centerY}
            x2={x2}
            y2={y2}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(99, 102, 241, 0.3)"
        stroke="#6366f1"
        strokeWidth="2"
      />

      {/* Labels */}
      {vectorEntries.map(([key], index) => {
        const angle = (index / vectorEntries.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius + 15);
        const y = centerY + Math.sin(angle) * (radius + 15);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[8px] fill-gray-500"
          >
            {formatVectorName(key).substring(0, 6)}
          </text>
        );
      })}
    </svg>
  );
}
