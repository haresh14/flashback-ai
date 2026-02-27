import React from 'react';
import { cn } from '../lib/utils';

interface DecadeSelectorProps {
    decades: string[];
    selectedDecades: string[];
    onToggleDecade: (decade: string) => void;
    maxSelection?: number;
    title?: string;
}

const DecadeSelector: React.FC<DecadeSelectorProps> = ({ 
    decades, 
    selectedDecades, 
    onToggleDecade, 
    maxSelection = 6,
    title = "Select Decades"
}) => {
    return (
        <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10 w-full">
            <h2 className="font-permanent-marker text-2xl text-yellow-400 mb-4">{title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {decades.map(decade => {
                    const isSelected = selectedDecades.includes(decade);
                    const isDisabled = !isSelected && selectedDecades.length >= maxSelection;
                    
                    return (
                        <button
                            key={decade}
                            disabled={isDisabled}
                            onClick={() => onToggleDecade(decade)}
                            className={cn(
                                "py-2 px-3 rounded-md font-mono text-sm transition-all duration-200 border",
                                isSelected 
                                    ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]" 
                                    : "bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                            )}
                        >
                            {decade}
                        </button>
                    );
                })}
            </div>
            <p className="mt-4 text-neutral-500 text-xs font-mono">
                {selectedDecades.length} / {maxSelection} selected
            </p>
        </div>
    );
};

export default DecadeSelector;
