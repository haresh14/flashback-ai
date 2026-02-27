import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, X, Download, RefreshCcw } from 'lucide-react';

interface ImageModalProps {
    imageUrl: string;
    title?: string;
    onClose: () => void;
    onDownload?: () => void;
    onRegenerate?: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, onClose, onDownload, onRegenerate }) => {
    const [scale, setScale] = useState(1);

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.max(prev - 0.25, 0.5));
    };

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
                    <div className="relative overflow-hidden rounded-lg shadow-2xl">
                        <motion.img
                            src={imageUrl}
                            alt={title || "Zoomed view"}
                            animate={{ scale }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            className="max-w-full max-h-[80vh] object-contain"
                        />
                        {title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 text-center">
                                <p className="font-permanent-marker text-white text-xl sm:text-2xl">{title}</p>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                        {onRegenerate && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRegenerate();
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
                                    onDownload();
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
