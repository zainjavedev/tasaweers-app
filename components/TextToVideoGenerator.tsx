import React, { useEffect, useRef, useState } from 'react';
import { GeneratedVideo, VideoAspectRatio, VideoModel } from '../types';
import { generateVideo, optimizePrompt } from '../services/veoService';
import Spinner from './Spinner';
import LoadingPlaceholder from './LoadingPlaceholder';
import { DownloadIcon, ExtendIcon, OptimizeIcon } from './Icons';
import { loadingMessages } from '../constants/loadingMessages';
import { MODEL_IDS, VIDEO_MODEL_INFO, VIDEO_MODEL_OPTIONS_PROMPT } from '../constants/modelInfo';

type TextToVideoGeneratorProps = {
    onGoToExtend: (videoData: GeneratedVideo) => void;
};

const TextToVideoGenerator: React.FC<TextToVideoGeneratorProps> = ({ onGoToExtend }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [videoModel, setVideoModel] = useState<VideoModel>(MODEL_IDS.VEO_31_FAST_PREVIEW);
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<{ url: string; data: GeneratedVideo } | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let interval: number | undefined;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage((prev) => {
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
            const optimized = await optimizePrompt(prompt, 'video');
            setPrompt(optimized);
        } catch (e: any) {
            setError(e.message || 'Failed to optimize prompt.');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!prompt) {
            setError('Please provide a prompt.');
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
            const { videoUrl, videoData } = await generateVideo(
                prompt,
                aspectRatio,
                setLoadingMessage,
                { modelId: videoModel }
            );
            setGeneratedVideo({ url: videoUrl, data: videoData });
        } catch (e: any) {
            const errorMessage = e.message || 'An unknown error occurred.';
            setError(errorMessage);
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
    const activeModelId = generatedVideo?.data.modelId ?? videoModel;
    const activeModelInfo =
        VIDEO_MODEL_INFO[activeModelId] ?? VIDEO_MODEL_INFO[MODEL_IDS.VEO_31_FAST_PREVIEW];

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt-video" className="block text-lg font-semibold">
                            1. Describe the Video
                        </label>
                        <button
                            onClick={handleOptimizePrompt}
                            disabled={!prompt || isOptimizing || isLoading}
                            className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-100 text-black border border-gray-400 font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Use AI to improve your prompt"
                        >
                            {isOptimizing ? (
                                <>
                                    <Spinner className="w-4 h-4 text-black" />
                                    <span>Optimizing...</span>
                                </>
                            ) : (
                                <>
                                    <OptimizeIcon />
                                    <span>Improve Prompt</span>
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        id="prompt-video"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A high-speed chase through a futuristic city, with flying vehicles weaving between neon-lit skyscrapers, cinematic, 4k."
                        className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28"
                    />
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">2. Select Aspect Ratio</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {[
                            {
                                value: '16:9' as VideoAspectRatio,
                                label: 'Landscape 16:9',
                                useCase: 'YouTube videos, LinkedIn promos',
                            },
                            {
                                value: '9:16' as VideoAspectRatio,
                                label: 'Portrait 9:16',
                                useCase: 'Shorts, Reels, TikTok vertical',
                            },
                        ].map(({ value, label, useCase }) => (
                            <button
                                key={value}
                                onClick={() => setAspectRatio(value)}
                                className={`flex-1 py-3 px-4 rounded-lg text-left text-sm transition-colors ${
                                    aspectRatio === value
                                        ? 'bg-black text-white'
                                        : 'bg-white hover:bg-gray-100 text-black border border-gray-300'
                                }`}
                            >
                                <span className="font-semibold block">{label}</span>
                                <span className="text-xs opacity-80">{useCase}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">3. Select Video Model</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {VIDEO_MODEL_OPTIONS_PROMPT.map(({ id, displayName, usageHint }) => (
                            <button
                                key={id}
                                onClick={() => setVideoModel(id)}
                                className={`py-3 px-4 rounded-lg text-left text-sm transition-colors ${
                                    videoModel === id
                                        ? 'bg-black text-white'
                                        : 'bg-white hover:bg-gray-100 text-black border border-gray-300'
                                }`}
                            >
                                <span className="font-semibold block">{displayName}</span>
                                <span className="text-xs opacity-80">{usageHint}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleGenerateVideo}
                    disabled={isGenerationDisabled}
                    className={`w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                        isLoading ? 'animate-pulse' : ''
                    }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            Generating... <Spinner className="w-5 h-5 ml-2 text-white" />
                        </span>
                    ) : (
                        'Generate Video'
                    )}
                </button>
            </div>
            <div
                ref={outputRef}
                className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px] gap-4"
            >
                <div className="self-stretch text-left">
                    <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                        Video model
                    </p>
                    <p className="text-sm text-gray-700">{activeModelInfo.displayName}</p>
                    <p className="text-xs text-gray-500">{activeModelInfo.usageHint}</p>
                </div>
                {isLoading ? (
                    <LoadingPlaceholder
                        message={loadingMessage}
                        subtext="Video generation can take several minutes."
                        showProgressBar
                    />
                ) : error ? (
                    <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                ) : generatedVideo ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <video
                            src={generatedVideo.url}
                            controls
                            autoPlay
                            loop
                            className="w-full h-full rounded-lg bg-black object-contain flex-1"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <button
                                onClick={handleDownloadVideo}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <DownloadIcon /> Download
                            </button>
                            <button
                                onClick={() => onGoToExtend(generatedVideo.data)}
                                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <ExtendIcon /> Extend Video
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p className="text-lg">Your generated video will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextToVideoGenerator;
