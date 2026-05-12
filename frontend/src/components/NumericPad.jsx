import { Delete } from "lucide-react";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "del"],
];

export default function NumericPad({ onKey, decimal = false, testidPrefix = "numeric-pad", disabled }) {
  return (
    <div className="grid grid-cols-3 gap-2" data-testid={testidPrefix}>
      {KEYS.flat().map((k) => {
        const isDecimal = k === ".";
        const isDel = k === "del";
        if (isDecimal && !decimal) {
          return <div key={k} className="h-14" />;
        }
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            data-testid={`${testidPrefix}-key-${k}`}
            onClick={() => onKey?.(k)}
            className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] active:scale-95 text-white text-xl font-light transition-colors duration-100 disabled:opacity-50 flex items-center justify-center select-none"
          >
            {isDel ? <Delete className="h-5 w-5" /> : k}
          </button>
        );
      })}
    </div>
  );
}
