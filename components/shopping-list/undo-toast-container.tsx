import { CheckCircle2 } from "lucide-react";
import { type UndoToast } from "./types";

interface UndoToastContainerProps {
  undoToasts: UndoToast[];
  onUndo: (toast: UndoToast) => void;
}

export function UndoToastContainer({ undoToasts, onUndo }: UndoToastContainerProps) {
  return (
    <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-6">
      {undoToasts.map((toast) => (
        <div key={toast.item.id} className="flex items-center gap-3 rounded-2xl bg-[#1a1d26] px-4 py-3 text-sm text-white shadow-xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="font-medium">{toast.item.name}</span>
          <span className="text-white/50">marked as bought</span>
          <button
            type="button"
            onClick={() => onUndo(toast)}
            className="ml-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            Undo
          </button>
        </div>
      ))}
    </div>
  );
}
