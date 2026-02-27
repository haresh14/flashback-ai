import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, X, Download, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageModalItem {
    url: string;
    caption: string;
}

interface ImageModalProps {
    items: ImageModalItem[];
    initialIndex?: number;
    onClose: () => void;
    onDownload?: (url: string, caption: string) => void;
    onRegenerate?: (caption: string) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ items, initialIndex = 0, onClose, onDownload, onRegenerate }) => {
    const [scale, setScale] = useState(1);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.max(prev - 0.25, 0.5));
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
        setScale(1); // Reset zoom on change
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
        setScale(1); // Reset zoom on change
    };

    const currentItem = items[currentIndex];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10 cursor-zoom-out"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative max-w-full max-h-full flex flex-col items-center justify-center cursor-default"
                >
                    <div className="relative overflow-hidden rounded-lg shadow-2xl group">
                        <motion.img
                            key={currentItem.url}
                            src={currentItem.url}
                            alt={currentItem.caption || "Zoomed view"}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0, scale }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            className="max-w-full max-h-[80vh] object-contain"
                        />
                        
                        {items.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={24} />
                                </button>
                                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-mono">
                                    {currentIndex + 1} / {items.length}
                                </div>
                            </>
                        )}

                        {currentItem.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 text-center">
                                <p className="font-permanent-marker text-white text-xl sm:text-2xl">{currentItem.caption}</p>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                        {onRegenerate && currentItem.caption !== 'Original' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRegenerate(currentItem.caption);
                                }}
                                className="p-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full transition-colors shadow-lg"
                                title="Regenerate this decade"
                            >
                                <RefreshCcw size={24} />
                            </button>
                        )}
                        {onDownload && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload(currentItem.url, currentItem.caption);
                                }}
                                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md border border-white/30"
                                title="Download image"
                            >
                                <Download size={24} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mt-6 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                            aria-label="Zoom out"
                        >
                            <ZoomOut size={24} />
                        </button>
                        <span className="text-white font-mono min-w-[3rem] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                            aria-label="Zoom in"
                        >
                            <ZoomIn size={24} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageModal;
