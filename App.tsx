/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { motion } from 'framer-motion';
import { generateDecadeImage } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import ImageModal from './components/ImageModal';
import HistorySidebar, { HistoryItem } from './components/HistorySidebar';
import { createAlbumPage } from './lib/albumUtils';
import { cn } from './lib/utils';
import { dbService } from './services/dbService';
import Footer from './components/Footer';
import { Clock, AlertCircle } from 'lucide-react';

// Error Boundary Component
interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState;
    public props: ErrorBoundaryProps;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle className="text-red-500 mb-4" size={48} />
                    <h2 className="text-2xl font-permanent-marker text-white mb-2">Something went wrong</h2>
                    <p className="text-neutral-400 font-mono text-sm max-w-md mb-6">
                        {this.state.error?.message || "An unexpected error occurred."}
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="font-permanent-marker text-black bg-yellow-400 py-2 px-6 rounded-sm hover:bg-yellow-300 transition-colors"
                    >
                        Reload App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const DECADES = [
    '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', 
    '2010s', '2020s', '2030s', '2040s', '2050s', '2060s', 
    '2070s', '2080s', '2090s', '2100s'
];

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '10%', rotate: -8 },
    { top: '15%', left: '60%', rotate: 5 },
    { top: '45%', left: '5%', rotate: 3 },
    { top: '2%', left: '35%', rotate: 10 },
    { top: '40%', left: '70%', rotate: -12 },
    { top: '50%', left: '38%', rotate: -3 },
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];


type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageAspectRatio, setImageAspectRatio] = useState<number>(0.75); // Default to 3/4
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const [selectedDecades, setSelectedDecades] = useState<string[]>(['1950s', '1960s', '1970s', '1980s', '1990s', '2000s']);
    const [selectedImage, setSelectedImage] = useState<{url: string, caption: string} | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Load history on mount and migrate if needed
    useEffect(() => {
        const initHistory = async () => {
            // 1. Check for legacy localStorage data
            const savedHistory = localStorage.getItem('flashback_history');
            if (savedHistory) {
                try {
                    const legacyHistory: HistoryItem[] = JSON.parse(savedHistory);
                    // Migrate to IndexedDB
                    for (const item of legacyHistory) {
                        await dbService.saveHistoryItem(item);
                    }
                    // Clear legacy storage
                    localStorage.removeItem('flashback_history');
                    console.log("Migrated history from localStorage to IndexedDB");
                } catch (e) {
                    console.error("Failed to migrate history", e);
                }
            }

            // 2. Load from IndexedDB
            try {
                const allHistory = await dbService.getAllHistory();
                setHistory(allHistory);
            } catch (e) {
                console.error("Failed to load history from IndexedDB", e);
            }
        };

        initHistory();
    }, []);

    // Auto-save current session to history
    useEffect(() => {
        if (appState !== 'idle' && uploadedImage && currentSessionId) {
            const newItem: HistoryItem = {
                id: currentSessionId,
                timestamp: Date.now(),
                originalImage: uploadedImage,
                aspectRatio: imageAspectRatio,
                selectedDecades,
                generatedImages: generatedImages as any,
                appState: appState as any
            };

            // Update local state for UI
            setHistory(prev => {
                const filtered = prev.filter(item => item.id !== currentSessionId);
                return [newItem, ...filtered].slice(0, 20); // Can afford more with IndexedDB
            });

            // Save to IndexedDB
            dbService.saveHistoryItem(newItem).catch(e => {
                console.error("Failed to save session to IndexedDB", e);
            });
        }
    }, [generatedImages, appState, uploadedImage, selectedDecades, currentSessionId]);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setUploadedImage(base64);
                
                // Detect aspect ratio
                const img = new Image();
                img.onload = () => {
                    setImageAspectRatio(img.width / img.height);
                };
                img.src = base64;

                setAppState('image-uploaded');
                setGeneratedImages({}); // Clear previous results
                setCurrentSessionId(null); // Don't set session ID yet, wait for Generate
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage || selectedDecades.length === 0) return;

        setIsLoading(true);
        setAppState('generating');
        setCurrentSessionId(Date.now().toString()); // Initialize session ID here on Generate
        
        const initialImages: Record<string, GeneratedImage> = {};
        selectedDecades.forEach(decade => {
            initialImages[decade] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2; // Allow 2 parallel requests for better speed
        const decadesQueue = [...selectedDecades];

        const processDecade = async (decade: string, index: number) => {
            // Staggered start: wait 2 seconds per index to spread out initial requests
            if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000 * index));
            }
            
            try {
                const prompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;
                const resultUrl = await generateDecadeImage(uploadedImage, prompt);
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${decade}:`, err);
            }
        };

        // Start all processes, they will stagger themselves internally
        const generationPromises = selectedDecades.map((decade, index) => processDecade(decade, index));
        await Promise.all(generationPromises);

        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegenerateDecade = async (decade: string) => {
        if (!uploadedImage) return;

        // Prevent re-triggering if a generation is already in progress
        if (generatedImages[decade]?.status === 'pending') {
            return;
        }
        
        console.log(`Regenerating image for ${decade}...`);

        // Set the specific decade to 'pending' to show the loading spinner
        setGeneratedImages(prev => ({
            ...prev,
            [decade]: { status: 'pending' },
        }));

        // Call the generation service for the specific decade
        try {
            const prompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;
            const resultUrl = await generateDecadeImage(uploadedImage, prompt);
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${decade}:`, err);
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setImageAspectRatio(0.75);
        setGeneratedImages({});
        setAppState('idle');
        setCurrentSessionId(null);
    };

    const handleSelectHistoryItem = (item: HistoryItem) => {
        setUploadedImage(item.originalImage);
        setImageAspectRatio(item.aspectRatio || 0.75);
        setSelectedDecades(item.selectedDecades);
        setGeneratedImages(item.generatedImages as any);
        setAppState(item.appState as any);
        setCurrentSessionId(item.id);
        setIsHistoryOpen(false);
    };

    const handleDeleteHistoryItem = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
        dbService.deleteHistoryItem(id).catch(e => {
            console.error("Failed to delete item from IndexedDB", e);
        });
        if (currentSessionId === id) {
            handleReset();
        }
    };

    const handleDownloadIndividualImage = (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `past-forward-${decade}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = (Object.entries(generatedImages) as [string, GeneratedImage][])
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < selectedDecades.length) {
                alert("Please wait for all images to finish generating before downloading the album.");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'past-forward-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>
            
            {/* History Toggle Button */}
            <button
                onClick={() => setIsHistoryOpen(true)}
                className="fixed top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white transition-all hover:scale-110 active:scale-95 group"
                aria-label="Open history"
            >
                <Clock size={24} className="group-hover:text-yellow-400 transition-colors" />
                {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-black">
                        {history.length}
                    </span>
                )}
            </button>

            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-caveat font-bold text-neutral-100">Flashback AI</h1>
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">Generate yourself through the decades.</p>
                </div>

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {/* Ghost polaroids for intro animation */}
                        {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                             <motion.div
                                key={index}
                                className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-100/10 blur-sm"
                                initial={config.initial}
                                animate={{
                                    x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{
                                    ...config.transition,
                                    ease: "circOut",
                                    duration: 2,
                                }}
                            />
                        ))}
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 2, duration: 0.8, type: 'spring' }}
                             className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                 <PolaroidCard 
                                     caption="Click to begin"
                                     status="done"
                                 />
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <p className="mt-8 font-permanent-marker text-neutral-500 text-center max-w-xs text-lg">
                                Click the polaroid to upload your photo and start your journey through time.
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
                         <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                            <div className="flex-shrink-0">
                                <PolaroidCard 
                                    imageUrl={uploadedImage} 
                                    aspectRatio={imageAspectRatio}
                                    caption="Original" 
                                    status="done"
                                    disableAnimation={true}
                                    onClick={(url, caption) => setSelectedImage({ url, caption })}
                                />
                            </div>
                            
                            <div className="flex-grow w-full">
                                <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
                                    <h2 className="font-permanent-marker text-2xl text-yellow-400 mb-4">Select up to 6 Decades</h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {DECADES.map(decade => {
                                            const isSelected = selectedDecades.includes(decade);
                                            const isDisabled = !isSelected && selectedDecades.length >= 6;
                                            
                                            return (
                                                <button
                                                    key={decade}
                                                    disabled={isDisabled}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedDecades(prev => prev.filter(d => d !== decade));
                                                        } else {
                                                            setSelectedDecades(prev => [...prev, decade]);
                                                        }
                                                    }}
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
                                        {selectedDecades.length} / 6 selected
                                    </p>
                                </div>
                            </div>
                         </div>

                         <div className="flex items-center gap-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Different Photo
                            </button>
                            <button 
                                onClick={handleGenerateClick} 
                                disabled={selectedDecades.length === 0}
                                className={cn(primaryButtonClasses, "disabled:opacity-50 disabled:cursor-not-allowed")}
                            >
                                Generate {selectedDecades.length > 0 ? `(${selectedDecades.length})` : ''}
                            </button>
                         </div>
                    </div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                                <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                                    {selectedDecades.map((decade) => (
                                        <div key={decade} className="flex justify-center">
                                             <PolaroidCard
                                                caption={decade}
                                                aspectRatio={imageAspectRatio}
                                                status={generatedImages[decade]?.status || 'pending'}
                                                imageUrl={generatedImages[decade]?.url}
                                                error={generatedImages[decade]?.error}
                                                onShake={handleRegenerateDecade}
                                                onDownload={handleDownloadIndividualImage}
                                                onClick={(url, caption) => setSelectedImage({ url, caption })}
                                                isMobile={isMobile}
                                            />
                                        </div>
                                    ))}
                                </div>
                        ) : (
                            <div ref={dragAreaRef} className="relative w-full max-w-5xl h-[600px] mt-4">
                                {selectedDecades.map((decade, index) => {
                                    const position = POSITIONS[index % POSITIONS.length];
                                    const { top, left, rotate } = position;
                                    return (
                                        <motion.div
                                            key={decade}
                                            className="absolute cursor-grab active:cursor-grabbing"
                                            style={{ top, left }}
                                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1, 
                                                y: 0,
                                                rotate: `${rotate}deg`,
                                            }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                                        >
                                            <PolaroidCard 
                                                dragConstraintsRef={dragAreaRef}
                                                caption={decade}
                                                aspectRatio={imageAspectRatio}
                                                status={generatedImages[decade]?.status || 'pending'}
                                                imageUrl={generatedImages[decade]?.url}
                                                error={generatedImages[decade]?.error}
                                                onShake={handleRegenerateDecade}
                                                onDownload={handleDownloadIndividualImage}
                                                onClick={(url, caption) => setSelectedImage({ url, caption })}
                                                isMobile={isMobile}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                         <div className="h-20 mt-4 flex items-center justify-center">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button 
                                        onClick={handleDownloadAlbum} 
                                        disabled={isDownloading} 
                                        className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating Album...' : 'Download Album'}
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
            {selectedImage && (
                <ImageModal 
                    imageUrl={selectedImage.url} 
                    title={selectedImage.caption}
                    onClose={() => setSelectedImage(null)} 
                />
            )}

            <HistorySidebar 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onSelect={handleSelectHistoryItem}
                onDelete={handleDeleteHistoryItem}
            />
        </main>
    );
}

function AppWrapper() {
    return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}

export default AppWrapper;
