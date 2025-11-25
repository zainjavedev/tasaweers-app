import React, { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { VideoAspectRatio, ImageAspectRatio, ImageModel, GeneratedVideo, Tab, VideoModel } from './types';
import { generateVideo, optimizePrompt, generateImage, optimizeImagePromptForVideo, editImage } from './services/veoService';
import Spinner from './components/Spinner';

const loadingMessages = [
  "Warming up the digital director's chair...",
  "Storyboarding your vision...",
  "Rendering the first few frames...",
  "Adding special effects and cinematic flair...",
  "The digital popcorn is almost ready...",
  "Final touches are being applied by our AI artisans...",
  "Adjusting the lighting and camera angles...",
];

const ExtendIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const OptimizeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13.5l.648 1.938a3.375 3.375 0 002.672 2.672L21.75 18l-1.938.648a3.375 3.375 0 00-2.672 2.672z" />
    </svg>
);

const EditIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const WorkflowIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-12 h-12"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
);

const UsePromptIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-2.474m0 0L3.182 6.374l2.225 10.482L13.684 16.6Zm0 0L19.5 7.125" />
    </svg>
);

const LoadingPlaceholder: React.FC<{ message: string; showProgressBar?: boolean; subtext?: string }> = ({ message, showProgressBar = false, subtext }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gray-100 rounded-lg relative overflow-hidden shimmer-bg p-4 min-h-[200px]">
        <Spinner className="w-12 h-12 mx-auto mb-4 text-black"/>
        <p className="text-lg font-semibold text-gray-800">{message}</p>
        {subtext && <p className="text-sm text-gray-500 mt-2">{subtext}</p>}
        {showProgressBar && (
            <div className="w-3/4 max-w-sm mt-4 h-1 bg-gray-300 rounded-full overflow-hidden relative">
                <div className="progress-bar-indeterminate w-full h-full"></div>
            </div>
        )}
    </div>
);

interface ChatGeneratorProps {
    onUsePrompt: (prompt: string) => void;
    onApiKeyError: () => void;
}

const ChatGenerator: React.FC<ChatGeneratorProps> = ({ onUsePrompt, onApiKeyError }) => {
    const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
        { role: 'model', text: 'Hello! How can I help you brainstorm some amazing image prompts today?' }
    ]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are a creative assistant helping users brainstorm vivid, detailed, and cinematic prompts for an AI image and video generator. Be imaginative and provide descriptive ideas. When providing a prompt, make it concise and directly usable. Do not wrap prompts in quotation marks.',
                },
            });
        } catch (e: any) {
            setError("Failed to initialize the chat model. Please check your API Key.");
            if (e.message?.includes("API key not valid")) {
                onApiKeyError();
            }
        }
    }, [onApiKeyError]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading || !chatRef.current) return;

        const currentMessage = message;
        setMessage('');
        setIsLoading(true);
        setError(null);
        setHistory(prev => [...prev, { role: 'user', text: currentMessage }]);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: currentMessage });
            
            let modelResponse = '';
            setHistory(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = modelResponse;
                    return newHistory;
                });
            }
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "An unknown error occurred.");
            }
             setHistory(prev => prev.slice(0, prev.length -1)); // remove empty model message on error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col" style={{height: '70vh'}}>
             <h2 className="text-xl font-bold mb-4 text-center">Prompt Ideation Chat</h2>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4 -mr-4 mb-4 space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.role === 'model' && msg.text && !isLoading && (
                                <button onClick={() => onUsePrompt(msg.text)} className="mt-2 flex items-center gap-1.5 text-xs bg-white hover:bg-gray-200 text-black border border-gray-400 font-semibold py-1 px-2 rounded-md transition-colors" title="Use this as a prompt in the image generator">
                                    <UsePromptIcon className="w-3 h-3"/>
                                    <span>Use Prompt</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-lg p-3 rounded-lg bg-gray-100 text-black">
                           <Spinner className="w-5 h-5" />
                        </div>
                    </div>
                )}
            </div>
             {error && <div className="text-center text-red-700 bg-red-100 p-2 rounded-lg mb-2 text-sm">{error}</div>}
            <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Ask for prompt ideas..."
                    className="flex-1 w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 resize-none"
                    rows={1}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    className="bg-black text-white font-bold py-3 px-5 rounded-lg transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Spinner className="w-5 h-5"/> : 'Send'}
                </button>
            </div>
        </div>
    );
};

interface TextToImageGeneratorProps {
    onUseForVideo: (imageBase64: string, prompt: string) => void;
    onUseForEditing: (imageBase64: string, prompt: string) => void;
    onApiKeyError: () => void;
    initialPrompt?: string | null;
}

const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({ onUseForVideo, onUseForEditing, onApiKeyError, initialPrompt }) => {
    const [prompt, setPrompt] = useState('');
    const [imageModel, setImageModel] = useState<ImageModel>('imagen-4.0-generate-001');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isReferenceSectionOpen, setIsReferenceSectionOpen] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    const handleReferenceImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (imageModel === 'imagen-4.0-generate-001') {
                setImageModel('gemini-2.5-flash-image'); // Switch to a compatible model if current is incompatible
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Clear the input value to allow re-uploading the same file
        e.target.value = '';
    };

    const handleRemoveReferenceImage = () => {
        setReferenceImage(null);
    };

    const handleModelChange = (newModel: ImageModel) => {
        if (referenceImage && newModel === 'imagen-4.0-generate-001') {
            if (window.confirm("Switching to the Imagen model will remove your reference image. Do you want to continue?")) {
                setReferenceImage(null);
                setImageModel(newModel);
            }
        } else {
            setImageModel(newModel);
        }
    };

    const handleOptimizePrompt = async () => {
        if (!prompt || isLoading || isOptimizing) return;
        setIsOptimizing(true);
        setError(null);
        try {
            const optimized = await optimizePrompt(prompt);
            setPrompt(optimized);
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "Failed to optimize prompt.");
            }
        } finally {
            setIsOptimizing(false);
        }
    };
    
    const handleGenerateImage = async () => {
        if (!prompt) {
            setError("Please provide a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        
        if (window.innerWidth < 1024) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            const imageUrl = await generateImage(prompt, imageModel, aspectRatio, referenceImage);
            setGeneratedImage(imageUrl);
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "An unknown error occurred during image generation.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerationDisabled = isLoading || isOptimizing || !prompt;

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Input Column */}
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt" className="block text-lg font-semibold">1. Describe Your Image</label>
                        <button onClick={handleOptimizePrompt} disabled={!prompt || isOptimizing || isLoading} className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-100 text-black border border-gray-400 font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Use AI to improve your prompt">
                            {isOptimizing ? (<><Spinner className="w-4 h-4 text-black" /><span>Optimizing...</span></>) : (<><OptimizeIcon /><span>Improve Prompt</span></>)}
                        </button>
                    </div>
                    <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A cyberpunk cityscape at night, rain-slicked streets reflecting neon signs, a lone figure in a trench coat walks towards the camera. 4K, photorealistic, cinematic." className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28" />
                </div>
                <div>
                    <button onClick={() => setIsReferenceSectionOpen(!isReferenceSectionOpen)} className="w-full flex justify-between items-center text-lg font-semibold text-left py-2">
                        <span>2. Add Reference Image <span className="text-sm font-normal text-gray-500">(Optional)</span></span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-transform duration-200 ${isReferenceSectionOpen ? 'transform rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    {isReferenceSectionOpen && (
                        <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {referenceImage ? (
                                    <div className="relative group mx-auto">
                                        <img src={referenceImage} alt="Reference preview" className="mx-auto h-24 w-auto rounded-lg object-contain"/>
                                        <button onClick={handleRemoveReferenceImage} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-gray-600 hover:text-black focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity border border-gray-300 shadow-sm" title="Remove image">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                )}
                                <div className="flex text-sm justify-center">
                                    <label htmlFor="file-upload-ref" className="relative cursor-pointer bg-gray-200 rounded-md font-semibold text-black hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-black px-3 py-1">
                                        <span>{referenceImage ? "Change image" : "Upload an image"}</span>
                                        <input id="file-upload-ref" name="file-upload-ref" type="file" className="sr-only" onChange={handleReferenceImageChange} accept="image/*"/>
                                    </label>
                                </div>
                                {!referenceImage && <p className="text-xs text-gray-500 pt-1">Using a reference requires a Nano Banana model.</p>}
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">3. Select Model</label>
                    <div className="flex space-x-2">
                        {(['imagen-4.0-generate-001', 'gemini-2.5-flash-image', 'gemini-3-pro-image-preview'] as ImageModel[]).map((model) => (
                            <button key={model} onClick={() => handleModelChange(model)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${imageModel === model ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {model === 'imagen-4.0-generate-001' ? 'Imagen' : model === 'gemini-2.5-flash-image' ? 'Nano Banana' : 'Nano Banana Pro'}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="block text-lg font-semibold mb-2">4. Select Aspect Ratio</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {( [{label: 'Thumbnail', value: '16:9'}, {label: 'Reel/Short', value: '9:16'}, {label: 'Square', value: '1:1'}] as {label: string, value: ImageAspectRatio}[] ).map(({label, value}) => (
                            <button key={value} onClick={() => setAspectRatio(value)} className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${aspectRatio === value ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {label} ({value})
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={handleGenerateImage} disabled={isGenerationDisabled} className={`w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isLoading ? 'animate-pulse' : ''}`}>
                   {isLoading ? <span className="flex items-center justify-center">Generating... <Spinner className="w-5 h-5 ml-2 text-white"/></span> : 'Generate Image'}
                </button>
            </div>
            {/* Output Column */}
            <div ref={outputRef} className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                {isLoading ? (
                    <LoadingPlaceholder message="Generating your image..." />
                ) : error ? (
                    <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg"><p className="font-bold">Error</p><p>{error}</p></div>
                ) : generatedImage ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <img src={generatedImage} alt="Generated image" className="w-full h-full rounded-lg bg-gray-100 object-contain flex-1"/>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <button onClick={handleDownloadImage} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                <DownloadIcon /> Download
                            </button>
                            <button onClick={() => onUseForEditing(generatedImage, prompt)} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                <EditIcon /> Edit
                            </button>
                            <button onClick={() => onUseForVideo(generatedImage, prompt)} className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                Animate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500"><p className="text-lg">Your generated image will appear here</p></div>
                )}
            </div>
        </div>
    );
};

interface TextToVideoGeneratorProps {
    onGoToExtend: (videoData: GeneratedVideo) => void;
    onApiKeyError: () => void;
}

const TextToVideoGenerator: React.FC<TextToVideoGeneratorProps> = ({ onGoToExtend, onApiKeyError }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [videoModel, setVideoModel] = useState<VideoModel>('veo-3.1-fast-generate-preview');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideo, setGeneratedVideo] = useState<{ url: string; data: GeneratedVideo } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        let interval: number | undefined;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleOptimizePrompt = async () => {
        if (!prompt || isLoading || isOptimizing) return;
        setIsOptimizing(true);
        setError(null);
        try {
            const optimized = await optimizePrompt(prompt);
            setPrompt(optimized);
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "Failed to optimize prompt.");
            }
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!prompt) {
            setError("Please provide a prompt.");
            return;
        }
        setIsLoading(true);
        setGeneratedVideo(null);
        setError(null);
        setLoadingMessage(loadingMessages[0]);
        
        if (window.innerWidth < 1024) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            const { videoUrl, videoData } = await generateVideo(prompt, aspectRatio, setLoadingMessage, { model: videoModel });
            setGeneratedVideo({ url: videoUrl, data: videoData });
        } catch (e: any) {
             if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                const errorMessage = e.message || "An unknown error occurred.";
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadVideo = () => {
        if (!generatedVideo?.url) return;
        const link = document.createElement('a');
        link.href = generatedVideo.url;
        link.download = `generated-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerationDisabled = isLoading || isOptimizing || !prompt;
    
    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Input Column */}
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt-video" className="block text-lg font-semibold">1. Describe the Video</label>
                        <button onClick={handleOptimizePrompt} disabled={!prompt || isOptimizing || isLoading} className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-100 text-black border border-gray-400 font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Use AI to improve your prompt">
                            {isOptimizing ? (<><Spinner className="w-4 h-4 text-black" /><span>Optimizing...</span></>) : (<><OptimizeIcon /><span>Improve Prompt</span></>)}
                        </button>
                    </div>
                    <textarea id="prompt-video" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={"A high-speed chase through a futuristic city, with flying vehicles weaving between neon-lit skyscrapers, cinematic, 4k."} className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28"/>
                </div>
                 <div>
                    <label className="block text-lg font-semibold mb-2">2. Select Model</label>
                    <div className="flex space-x-2">
                        {(['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'] as VideoModel[]).map((model) => (
                            <button key={model} onClick={() => setVideoModel(model)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${videoModel === model ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {model === 'veo-3.1-fast-generate-preview' ? 'Veo Fast' : 'Veo HD'}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Veo HD provides higher quality but may take longer to generate.</p>
                </div>
                 <div>
                    <label className="block text-lg font-semibold mb-2">3. Select Aspect Ratio</label>
                    <div className="flex space-x-2">
                        {(['16:9', '9:16'] as VideoAspectRatio[]).map((ratio) => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${aspectRatio === ratio ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {ratio === '16:9' ? 'Landscape' : 'Portrait'} ({ratio})
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={handleGenerateVideo} disabled={isGenerationDisabled} className={`w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isLoading ? 'animate-pulse' : ''}`}>
                   {isLoading ? <span className="flex items-center justify-center">Generating... <Spinner className="w-5 h-5 ml-2 text-white"/></span> : 'Generate Video'}
                </button>
            </div>

            {/* Output Column */}
            <div ref={outputRef} className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                {isLoading ? (
                    <LoadingPlaceholder 
                        message={loadingMessage}
                        subtext="Video generation can take several minutes."
                        showProgressBar={true}
                    />
                ) : error ? (
                     <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg"><p className="font-bold">Error</p><p>{error}</p></div>
                ) : generatedVideo ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <video src={generatedVideo.url} controls autoPlay loop className="w-full h-full rounded-lg bg-black object-contain flex-1"/>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <button onClick={handleDownloadVideo} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                <DownloadIcon /> Download
                            </button>
                            <button onClick={() => onGoToExtend(generatedVideo.data)} className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <ExtendIcon /> Extend Video
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500"><p className="text-lg">Your generated video will appear here</p></div>
                )}
            </div>
        </div>
    );
};

interface ImageToImageGeneratorProps {
    initialImageBase64: string | null;
    initialPrompt: string | null;
    onUseForVideo: (imageBase64: string, prompt: string) => void;
    onApiKeyError: () => void;
}

const ImageToImageGenerator: React.FC<ImageToImageGeneratorProps> = ({ initialImageBase64, initialPrompt, onUseForVideo, onApiKeyError }) => {
    const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
    const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [imageModel, setImageModel] = useState<ImageModel>('gemini-2.5-flash-image');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('16:9');
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialImageBase64) {
            setSourceImageBase64(initialImageBase64);
            setGeneratedImage(null);
            setError(null);
            setSourceImageFile(null); // Clear file input
        }
    }, [initialImageBase64]);

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSourceImageFile(file);
            setGeneratedImage(null);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSourceImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOptimizePrompt = async () => {
        if (!prompt || isLoading || isOptimizing) return;
        setIsOptimizing(true);
        setError(null);
        try {
            const optimized = await optimizePrompt(prompt);
            setPrompt(optimized);
        } catch (e: any) {
             if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "Failed to optimize prompt.");
            }
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt || !sourceImageBase64) {
            setError("Please provide an image and a prompt.");
            return;
        }
        setIsLoading(true);
        setGeneratedImage(null);
        setError(null);

        if (window.innerWidth < 1024) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            const resultImage = await editImage(prompt, sourceImageBase64, imageModel, aspectRatio);
            setGeneratedImage(resultImage);
        } catch (e: any) {
             if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "An unknown error occurred during image editing.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `edited-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseNewAsSource = () => {
        if (!generatedImage) return;
        setSourceImageBase64(generatedImage);
        setGeneratedImage(null);
        setError(null);
        setPrompt(''); // Clear prompt for new edit
    };

    const isGenerationDisabled = isLoading || isOptimizing || !prompt || !sourceImageBase64;

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Input Column */}
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <label htmlFor="image-upload-edit" className="block text-lg font-semibold mb-2">1. Source Image</label>
                    <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {sourceImageBase64 ? (
                                <img src={sourceImageBase64} alt="Upload preview" className="mx-auto h-48 w-auto rounded-lg object-contain"/>
                            ) : (
                                <><svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg><p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p></>
                            )}
                            <div className="flex text-sm justify-center">
                                <label htmlFor="file-upload-edit" className="relative cursor-pointer bg-gray-200 rounded-md font-semibold text-black hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-black px-3 py-1">
                                    <span>{sourceImageFile || sourceImageBase64 ? "Change image" : "Upload an image"}</span>
                                    <input id="file-upload-edit" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt-edit" className="block text-lg font-semibold">2. Describe Your Edit</label>
                        <button onClick={handleOptimizePrompt} disabled={!prompt || isOptimizing || isLoading} className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-100 text-black border border-gray-400 font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Use AI to improve your prompt">
                            {isOptimizing ? (<><Spinner className="w-4 h-4 text-black" /><span>Optimizing...</span></>) : (<><OptimizeIcon /><span>Improve Prompt</span></>)}
                        </button>
                    </div>
                    <textarea id="prompt-edit" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Add a futuristic helmet to the main figure." className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28"/>
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">3. Model</label>
                    <div className="flex space-x-2">
                        {(['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'] as ImageModel[]).map((model) => (
                            <button key={model} onClick={() => setImageModel(model)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${imageModel === model ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {model === 'gemini-2.5-flash-image' ? 'Nano Banana' : 'Nano Banana Pro'}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">4. Select Aspect Ratio</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {( [{label: 'Thumbnail', value: '16:9'}, {label: 'Reel/Short', value: '9:16'}, {label: 'Square', value: '1:1'}] as {label: string, value: ImageAspectRatio}[] ).map(({label, value}) => (
                            <button key={value} onClick={() => setAspectRatio(value)} className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${aspectRatio === value ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {label} ({value})
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={isGenerationDisabled} className={`w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isLoading ? 'animate-pulse' : ''}`}>
                   {isLoading ? <span className="flex items-center justify-center">Generating... <Spinner className="w-5 h-5 ml-2 text-white"/></span> : 'Generate Edit'}
                </button>
            </div>
            {/* Output Column */}
            <div ref={outputRef} className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                {isLoading ? (
                     <LoadingPlaceholder message="Applying your edits..." />
                ) : error ? (
                     <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg"><p className="font-bold">Error</p><p>{error}</p></div>
                ) : generatedImage ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <img src={generatedImage} alt="Edited image" className="w-full h-full rounded-lg bg-gray-100 object-contain flex-1"/>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                           <button onClick={handleDownloadImage} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                <DownloadIcon /> Download
                            </button>
                            <button onClick={handleUseNewAsSource} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                <EditIcon /> Edit Again
                            </button>
                            <button onClick={() => onUseForVideo(generatedImage, prompt)} className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                Animate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500"><p className="text-lg">Your edited image will appear here</p></div>
                )}
            </div>
        </div>
    );
};

interface ImageToVideoGeneratorProps {
    initialImageBase64: string | null;
    initialPrompt: string | null;
    onGoToExtend: (videoData: GeneratedVideo) => void;
    onApiKeyError: () => void;
}

const ImageToVideoGenerator: React.FC<ImageToVideoGeneratorProps> = ({ initialImageBase64, initialPrompt, onGoToExtend, onApiKeyError }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [videoModel, setVideoModel] = useState<VideoModel>('veo-3.1-fast-generate-preview');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideo, setGeneratedVideo] = useState<{ url: string; data: GeneratedVideo } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(initialImageBase64) {
            setImageBase64(initialImageBase64);
            setGeneratedVideo(null);
            setError(null);
            setImageFile(null); // Clear file input if we get a base64 string from the other tab
        }
    }, [initialImageBase64]);
    
    useEffect(() => {
        const optimize = async () => {
            if (initialPrompt) {
                setIsOptimizing(true);
                setError(null);
                setPrompt(''); // Clear previous prompt
                try {
                    const optimized = await optimizeImagePromptForVideo(initialPrompt);
                    setPrompt(optimized);
                } catch (e: any) {
                    if (e.message?.includes("Requested entity was not found")) {
                        onApiKeyError();
                    } else {
                        setError(e.message || "Failed to optimize prompt.");
                        setPrompt(initialPrompt); // Fallback to original prompt on error
                    }
                } finally {
                    setIsOptimizing(false);
                }
            }
        };
        optimize();
    }, [initialPrompt, onApiKeyError]);

    useEffect(() => {
        let interval: number | undefined;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setGeneratedVideo(null);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOptimizePrompt = async () => {
        if (!prompt || isLoading || isOptimizing) return;
        setIsOptimizing(true);
        setError(null);
        try {
            const optimized = await optimizePrompt(prompt);
            setPrompt(optimized);
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "Failed to optimize prompt.");
            }
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!prompt || !imageBase64) {
            setError("Please provide an image and a prompt.");
            return;
        }
        setIsLoading(true);
        setGeneratedVideo(null);
        setError(null);
        setLoadingMessage(loadingMessages[0]);

        if (window.innerWidth < 1024) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            const { videoUrl, videoData } = await generateVideo(prompt, aspectRatio, setLoadingMessage, { imageBase64, model: videoModel });
            setGeneratedVideo({ url: videoUrl, data: videoData });
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                const errorMessage = e.message || "An unknown error occurred.";
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadVideo = () => {
        if (!generatedVideo?.url) return;
        const link = document.createElement('a');
        link.href = generatedVideo.url;
        link.download = `generated-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerationDisabled = isLoading || isOptimizing || !prompt || !imageBase64;

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Input Column */}
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <label htmlFor="image-upload" className="block text-lg font-semibold mb-2">1. Upload or Use Image</label>
                    <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {imageBase64 ? (
                                <img src={imageBase64} alt="Upload preview" className="mx-auto h-48 w-auto rounded-lg object-contain"/>
                            ) : (
                                <><svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg><p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p></>
                            )}
                            <div className="flex text-sm justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-200 rounded-md font-semibold text-black hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-black px-3 py-1">
                                    <span>{imageFile || initialImageBase64 ? "Change image" : "Upload a file"}</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt-video-2" className="block text-lg font-semibold">2. Describe the Motion</label>
                        <button onClick={handleOptimizePrompt} disabled={!prompt || isOptimizing || isLoading} className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-100 text-black border border-gray-400 font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Use AI to improve your prompt">
                            {isOptimizing ? (<><Spinner className="w-4 h-4 text-black" /><span>Optimizing...</span></>) : (<><OptimizeIcon /><span>Improve Prompt</span></>)}
                        </button>
                    </div>
                    <textarea id="prompt-video-2" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={isOptimizing ? "Optimizing prompt for video..." : "Flying cars weave between towering skyscrapers, steam rises from street vents, the camera slowly pushes in on the lone figure."} className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28" disabled={isOptimizing}/>
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">3. Select Model</label>
                    <div className="flex space-x-2">
                        {(['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'] as VideoModel[]).map((model) => (
                            <button key={model} onClick={() => setVideoModel(model)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${videoModel === model ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {model === 'veo-3.1-fast-generate-preview' ? 'Veo Fast' : 'Veo HD'}
                            </button>
                        ))}
                    </div>
                     <p className="text-xs text-gray-500 mt-2">Veo HD provides higher quality but may take longer to generate.</p>
                </div>
                 <div>
                    <label className="block text-lg font-semibold mb-2">4. Select Aspect Ratio</label>
                    <div className="flex space-x-2">
                        {(['16:9', '9:16'] as VideoAspectRatio[]).map((ratio) => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${aspectRatio === ratio ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black border border-gray-300'}`}>
                                {ratio === '16:9' ? 'Landscape' : 'Portrait'} ({ratio})
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={handleGenerateVideo} disabled={isGenerationDisabled} className={`w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isLoading ? 'animate-pulse' : ''}`}>
                   {isLoading ? <span className="flex items-center justify-center">Generating... <Spinner className="w-5 h-5 ml-2 text-white"/></span> : 'Animate Image'}
                </button>
            </div>
            {/* Output Column */}
            <div ref={outputRef} className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                {isLoading ? (
                     <LoadingPlaceholder 
                        message={loadingMessage}
                        subtext="Video generation can take several minutes."
                        showProgressBar={true}
                    />
                ) : error ? (
                     <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg"><p className="font-bold">Error</p><p>{error}</p></div>
                ) : generatedVideo ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <video src={generatedVideo.url} controls autoPlay loop className="w-full h-full rounded-lg bg-black object-contain flex-1"/>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <button onClick={handleDownloadVideo} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                <DownloadIcon /> Download
                            </button>
                            <button onClick={() => onGoToExtend(generatedVideo.data)} className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <ExtendIcon /> Extend Video
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500"><p className="text-lg">Your generated video will appear here</p></div>
                )}
            </div>
        </div>
    );
};

interface VideoToVideoGeneratorProps {
    initialVideo: GeneratedVideo | null;
    onApiKeyError: () => void;
}

const VideoToVideoGenerator: React.FC<VideoToVideoGeneratorProps> = ({ initialVideo, onApiKeyError }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideo, setGeneratedVideo] = useState<{ url: string; data: GeneratedVideo } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let interval: number | undefined;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleOptimizePrompt = async () => {
        if (!prompt || isLoading || isOptimizing) return;
        setIsOptimizing(true);
        setError(null);
        try {
            const optimized = await optimizePrompt(prompt);
            setPrompt(optimized);
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                setError(e.message || "Failed to optimize prompt.");
            }
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!initialVideo) {
            setError("No video to extend. Please generate a video in other tabs first.");
            return;
        }
        if (!prompt) {
            setError("Please provide a prompt.");
            return;
        }
        setIsLoading(true);
        setGeneratedVideo(null);
        setError(null);
        setLoadingMessage(loadingMessages[0]);
        
        if (window.innerWidth < 1024) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            // Use the aspect ratio from the initial video, fallback to 16:9 if missing
            const aspectRatio = (initialVideo.config.aspectRatio as VideoAspectRatio) || '16:9';
            
            const { videoUrl, videoData } = await generateVideo(
                prompt, 
                aspectRatio, 
                setLoadingMessage, 
                { 
                    videoToExtend: initialVideo.video 
                }
            );
            setGeneratedVideo({ url: videoUrl, data: videoData });
        } catch (e: any) {
             if (e.message?.includes("Requested entity was not found")) {
                onApiKeyError();
            } else {
                const errorMessage = e.message || "An unknown error occurred.";
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadVideo = () => {
        if (!generatedVideo?.url) return;
        const link = document.createElement('a');
        link.href = generatedVideo.url;
        link.download = `extended-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerationDisabled = isLoading || isOptimizing || !prompt || !initialVideo;

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Input Column */}
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <label className="block text-lg font-semibold mb-2">1. Source Video</label>
                     <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50">
                        <div className="space-y-1 text-center">
                            {initialVideo ? (
                                <div className="flex flex-col items-center">
                                     <p className="text-sm text-green-600 font-semibold mb-2">Video selected for extension</p>
                                     <div className="bg-black text-white text-xs py-1 px-2 rounded">
                                        Aspect Ratio: {initialVideo.config.aspectRatio || 'Unknown'}
                                     </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <ExtendIcon className="w-12 h-12 mb-2 opacity-50"/>
                                    <p>No video selected.</p>
                                    <p className="text-sm mt-1">Generate a video in "Text to Video" or "Image to Video" tabs, then click "Extend Video".</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt-extend" className="block text-lg font-semibold">2. Describe the Extension</label>
                        <button onClick={handleOptimizePrompt} disabled={!prompt || isOptimizing || isLoading} className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-100 text-black border border-gray-400 font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Use AI to improve your prompt">
                            {isOptimizing ? (<><Spinner className="w-4 h-4 text-black" /><span>Optimizing...</span></>) : (<><OptimizeIcon /><span>Improve Prompt</span></>)}
                        </button>
                    </div>
                    <textarea id="prompt-extend" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={"Describe what happens next in the video..."} className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28"/>
                </div>

                 <div>
                    <label className="block text-lg font-semibold mb-2">3. Model Settings</label>
                    <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700">
                        <p><span className="font-semibold">Veo HD (veo-3.1-generate-preview)</span> is automatically used for video extension.</p>
                         <p className="mt-1">The resolution and aspect ratio will match the source video.</p>
                    </div>
                </div>

                <button onClick={handleGenerateVideo} disabled={isGenerationDisabled} className={`w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isLoading ? 'animate-pulse' : ''}`}>
                   {isLoading ? <span className="flex items-center justify-center">Generating... <Spinner className="w-5 h-5 ml-2 text-white"/></span> : 'Extend Video'}
                </button>
            </div>

            {/* Output Column */}
             <div ref={outputRef} className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                {isLoading ? (
                    <LoadingPlaceholder 
                        message={loadingMessage}
                        subtext="Extending video can take several minutes."
                        showProgressBar={true}
                    />
                ) : error ? (
                     <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg"><p className="font-bold">Error</p><p>{error}</p></div>
                ) : generatedVideo ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <video src={generatedVideo.url} controls autoPlay loop className="w-full h-full rounded-lg bg-black object-contain flex-1"/>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <button onClick={handleDownloadVideo} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                <DownloadIcon /> Download
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500"><p className="text-lg">Your extended video will appear here</p></div>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);
    const [isOpeningKeySelector, setIsOpeningKeySelector] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<Tab>('chat');
    
    const [promptFromChat, setPromptFromChat] = useState<string | null>(null);
    const [imageForVideo, setImageForVideo] = useState<string | null>(null);
    const [promptForVideo, setPromptForVideo] = useState<string | null>(null);

    const [imageForEditing, setImageForEditing] = useState<string | null>(null);
    const [promptForEditing, setPromptForEditing] = useState<string | null>(null);

    const [videoForExtension, setVideoForExtension] = useState<GeneratedVideo | null>(null);

    const checkApiKey = useCallback(async () => {
        setIsCheckingApiKey(true);
        try {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            } else {
                setApiKeySelected(false);
            }
        } catch (e) {
            console.error("Error checking API key:", e);
            setApiKeySelected(false);
        } finally {
            setIsCheckingApiKey(false);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        if (!window.aistudio) {
            setError("AI Studio context is not available. This app must be run within Google AI Studio.");
            return;
        }
        setIsOpeningKeySelector(true);
        setError(null);
        try {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        } catch (e) {
            console.error("Error opening select key dialog:", e);
            setError("Could not open the API key selection dialog. Please try again.");
            setApiKeySelected(false);
        } finally {
            setIsOpeningKeySelector(false);
        }
    };
    
    const handleApiKeyError = useCallback(() => {
        setApiKeySelected(false);
        setError("Your API key may be invalid or lack the necessary permissions. Please select a different key and try again.");
    }, []);
    
    const handleUsePromptFromChat = (prompt: string) => {
        setPromptFromChat(prompt);
        setActiveTab('text-to-image');
    };

    const handleUseForVideo = (imageBase64: string, prompt: string) => {
        setImageForVideo(imageBase64);
        setPromptForVideo(prompt);
        setActiveTab('image-to-video');
    };
    
    const handleUseForEditing = (imageBase64: string, prompt: string) => {
        setImageForEditing(imageBase64);
        setPromptForEditing(prompt);
        setActiveTab('image-to-image');
    };

    const handleGoToExtend = (videoData: GeneratedVideo) => {
        setVideoForExtension(videoData);
        setActiveTab('video-to-video');
    };
    
    const TabButton: React.FC<{tabId: Tab, children: React.ReactNode}> = ({tabId, children}) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors rounded-t-lg border-b-2 ${activeTab === tabId ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-transparent hover:bg-gray-100 hover:text-black'}`}
        >
            {children}
        </button>
    );

    const renderApiKeyPrompt = () => (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
            <div className="max-w-md bg-white border border-gray-300 p-8 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-black">Select API Key to Begin</h2>
                <p className="mb-6 text-gray-600">This application requires a Google AI API key. Please select your key to continue.</p>
                {error && <div className="mb-4 text-red-700 bg-red-100 p-3 rounded-lg"><p className="font-bold">Error</p><p>{error}</p></div>}
                <button 
                    onClick={handleSelectKey} 
                    disabled={isOpeningKeySelector}
                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isOpeningKeySelector ? (
                        <span className="flex items-center justify-center">Opening... <Spinner className="w-5 h-5 ml-2 text-white"/></span>
                    ) : (
                        'Select API Key'
                    )}
                </button>
                <p className="text-xs text-gray-500 mt-4">For billing info, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-black">ai.google.dev/gemini-api/docs/billing</a>.</p>
            </div>
        </div>
    );

    if (isCheckingApiKey) {
        return <div className="flex items-center justify-center h-screen"><Spinner className="w-12 h-12 text-black" /></div>;
    }

    if (!apiKeySelected) {
        return renderApiKeyPrompt();
    }

    return (
        <div className="min-h-screen bg-white text-black flex flex-col items-center p-2 sm:p-4 lg:p-8">
            <div className="w-full max-w-7xl">
                <header className="text-center my-6 md:my-8">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black">
                        Tasaweers
                    </h1>
                    <p className="mt-2 text-gray-600">Generate stunning images and bring them to life as dynamic videos.</p>
                </header>
                
                <div className="w-full border-b border-gray-300 mb-6 lg:mb-8">
                    <div className="flex overflow-x-auto whitespace-nowrap mobile-scroll-x-hidden">
                        <TabButton tabId="chat">Chat</TabButton>
                        <TabButton tabId="text-to-image">1. Text to Image</TabButton>
                        <TabButton tabId="image-to-image">2. Image to Image</TabButton>
                        <TabButton tabId="text-to-video">3. Text to Video</TabButton>
                        <TabButton tabId="image-to-video">4. Image to Video</TabButton>
                        <TabButton tabId="video-to-video">5. Video to Video</TabButton>
                    </div>
                </div>

                <main>
                   {activeTab === 'chat' && <ChatGenerator onUsePrompt={handleUsePromptFromChat} onApiKeyError={handleApiKeyError} />}
                   {activeTab === 'text-to-image' && <TextToImageGenerator initialPrompt={promptFromChat} onUseForVideo={handleUseForVideo} onUseForEditing={handleUseForEditing} onApiKeyError={handleApiKeyError} />}
                   {activeTab === 'image-to-image' && <ImageToImageGenerator initialImageBase64={imageForEditing} initialPrompt={promptForEditing} onUseForVideo={handleUseForVideo} onApiKeyError={handleApiKeyError} />}
                   {activeTab === 'text-to-video' && <TextToVideoGenerator onGoToExtend={handleGoToExtend} onApiKeyError={handleApiKeyError} />}
                   {activeTab === 'image-to-video' && <ImageToVideoGenerator initialImageBase64={imageForVideo} initialPrompt={promptForVideo} onGoToExtend={handleGoToExtend} onApiKeyError={handleApiKeyError} />}
                   {activeTab === 'video-to-video' && <VideoToVideoGenerator initialVideo={videoForExtension} onApiKeyError={handleApiKeyError} />}
                </main>
            </div>
        </div>
    );
};

export default App;