import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface HistoryItem {
    id: string;
    timestamp: number;
    originalImage: string;
    aspectRatio?: number;
    selectedDecades: string[];
    generatedImages: Record<string, { status: string; url?: string; error?: string; id: string }[]>;
    appState: 'image-uploaded' | 'generating' | 'results-shown';
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect, onDelete }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    
                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-neutral-900 border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-bottom border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="text-yellow-400" size={24} />
                                <h2 className="font-permanent-marker text-2xl text-white">Your History</h2>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full text-neutral-400 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <Clock size={48} className="mb-4" />
                                    <p className="font-mono text-sm">No history yet.<br/>Start generating to see your past journeys!</p>
                                </div>
                            ) : (
                                [...history].sort((a, b) => b.timestamp - a.timestamp).map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-yellow-400/50 transition-colors"
                                    >
                                        <div 
                                            onClick={() => onSelect(item)}
                                            className="flex items-center p-4 cursor-pointer"
                                        >
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0 border border-white/10">
                                                <img 
                                                    src={item.originalImage} 
                                                    alt="Original" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            <div className="ml-4 flex-1 min-w-0">
                                                <p className="text-white font-mono text-sm truncate">
                                                    {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-neutral-500 text-xs font-mono mt-1">
                                                    {item.selectedDecades.length} decades • {item.appState.replace('-', ' ')}
                                                </p>
                                            </div>
                                            
                                            <ChevronRight className="text-neutral-600 group-hover:text-yellow-400 transition-colors" size={20} />
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item.id);
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            aria-label="Delete history item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-black/20">
                            <p className="text-neutral-500 text-[10px] font-mono leading-relaxed">
                                History is saved locally in your browser. Clearing your browser data will remove these items.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HistorySidebar;
