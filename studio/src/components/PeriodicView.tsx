import { ElementData } from '../data-loader';

interface PeriodicViewProps {
  elements: ElementData[];
  selectedElement: ElementData | null;
  onSelectElement: (element: ElementData) => void;
}

// Element identities, periods and groups come from the canonical publication data.
import {periodicPosition} from '../periodic-position';

const CATEGORY_COLORS: Record<string, string> = {
  'Alkali Metal': 'bg-red-900/40 text-red-300',
  'Alkaline Earth Metal': 'bg-orange-900/40 text-orange-300',
  'Transition Metal': 'bg-yellow-900/40 text-yellow-300',
  'Post-Transition Metal': 'bg-green-900/40 text-green-300',
  'Metalloid': 'bg-teal-900/40 text-teal-300',
  'Reactive Nonmetal': 'bg-blue-900/40 text-blue-300',
  'Halogen': 'bg-indigo-900/40 text-indigo-300',
  'Noble Gas': 'bg-purple-900/40 text-purple-300',
  'Lanthanide': 'bg-pink-900/40 text-pink-300',
  'Actinide': 'bg-rose-900/40 text-rose-300',
};

export function PeriodicView({ elements, selectedElement, onSelectElement }: PeriodicViewProps) {
  const cells: JSX.Element[] = [];

  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 18; col++) {
      const el = elements.find(e => {
        const pos = periodicPosition(e);
        return pos && pos[0] === row && pos[1] === col;
      });

      if (!el) continue;

      const isSelected = selectedElement?.z === el.z;
      const colorClass = CATEGORY_COLORS[el.category] || 'bg-gray-800 text-gray-300';

      cells.push(
        <button
          key={el.z}
          onClick={() => onSelectElement(el)}
          title={`${el.name} (${el.symbol}) — MAT:${String(el.z).padStart(4,'0')} — ${el.recordStatus} — ${el.category}`}
          className={`w-8 h-8 flex flex-col items-center justify-center rounded text-[9px] leading-tight transition-all hover:scale-110 hover:shadow-lg ${
            isSelected ? 'ring-2 ring-amber-400 scale-110 z-10' : ''
          } ${colorClass}`}
          style={{ gridRow: row, gridColumn: col }}
        >
          <span className="font-mono text-[8px] opacity-60">{el.z}</span>
          <span className="font-bold text-[10px]">{el.symbol}</span>
        </button>
      );
    }
  }

  return (
    <div className="p-2 overflow-auto">
      <div className="text-xs text-gray-300 mb-2">Periodic Table — {elements.length} elements</div>
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: 'repeat(18, 1fr)',
          gridTemplateRows: 'repeat(10, auto)',
        }}
      >
        {cells}
      </div>

      {/* Lanthanide/Actinide labels */}
      <div className="mt-2 flex gap-4 text-[10px] text-gray-300">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-pink-900/40 rounded"></span>
          Lanthanides
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-rose-900/40 rounded"></span>
          Actinides
        </span>
      </div>

      {/* Category legend */}
      <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-gray-300">
        {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
          <span key={cat} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded ${cls.split(' ')[0]}`}></span>
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
