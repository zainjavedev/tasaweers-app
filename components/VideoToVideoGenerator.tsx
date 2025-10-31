import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeneratedVideo, VideoAspectRatio } from '../types';
import { generateVideo, optimizePrompt } from '../services/veoService';
import Spinner from './Spinner';
import LoadingPlaceholder from './LoadingPlaceholder';
import { DownloadIcon, ExtendIcon, OptimizeIcon, WorkflowIcon } from './Icons';
import { loadingMessages } from '../constants/loadingMessages';
import { MODEL_IDS, VIDEO_MODEL_INFO, VIDEO_MODEL_OPTIONS_EXTEND } from '../constants/modelInfo';

type VideoToVideoGeneratorProps = {
    initialVideo: GeneratedVideo | null;
};

const VideoToVideoGenerator: React.FC<VideoToVideoGeneratorProps> = ({ initialVideo }) => {
    const [sourceVideo, setSourceVideo] = useState<GeneratedVideo | null>(null);
    const [sourceVideoUrl, setSourceVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<{ url: string; data: GeneratedVideo } | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    const fetchVideoUrl = useCallback(async (videoData: GeneratedVideo) => {
        try {
            setLoadingMessage('Loading source video...');
            const response = await fetch(`${videoData.video.uri}&key=${process.env.API_KEY}`);
            if (!response.ok) throw new Error('Failed to fetch source video.');
            const videoBlob = await response.blob();
            return URL.createObjectURL(videoBlob);
        } catch (e) {
            setError('Could not load the source video for extension.');
            return null;
        } finally {
            setLoadingMessage('');
        }
    }, []);

    useEffect(() => {
        if (initialVideo) {
            setSourceVideo(initialVideo);
            setGeneratedVideo(null);
            setError(null);
            setPrompt('');
            fetchVideoUrl(initialVideo).then((url) => setSourceVideoUrl(url));
        }
    }, [initialVideo, fetchVideoUrl]);

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

    const handleExtendVideo = async () => {
        if (!prompt || !sourceVideo) {
            setError('A source video and a prompt are required to extend.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);
        setLoadingMessage('Preparing to extend video...');

        if (window.innerWidth < 1024) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            const currentAspectRatio = sourceVideo.config.aspectRatio as VideoAspectRatio;
            const { videoUrl, videoData } = await generateVideo(
                prompt,
                currentAspectRatio,
                setLoadingMessage,
                { videoToExtend: sourceVideo.video, modelId: MODEL_IDS.VEO_31_PREVIEW }
            );
            setGeneratedVideo({ url: videoUrl, data: videoData });
        } catch (e: any) {
            const errorMessage = e.message || 'An unknown error occurred during video extension.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseNewVideoAsSource = () => {
        if (!generatedVideo) return;
        setSourceVideo(generatedVideo.data);
        setSourceVideoUrl(generatedVideo.url);
        setGeneratedVideo(null);
        setPrompt('');
        setError(null);
    };

    const handleDownloadVideo = () => {
        const urlToDownload = generatedVideo?.url;
        if (!urlToDownload) return;
        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = `extended-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerationDisabled = isLoading || isOptimizing || !prompt || !sourceVideo;
    const outputVideo = generatedVideo;
    const currentSourceUrl = outputVideo ? sourceVideoUrl : sourceVideoUrl || '';
    const activeModelId = generatedVideo?.data.modelId ?? MODEL_IDS.VEO_31_PREVIEW;
    const activeModelInfo =
        VIDEO_MODEL_INFO[activeModelId] ?? VIDEO_MODEL_INFO[MODEL_IDS.VEO_31_PREVIEW];

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <label className="block text-lg font-semibold mb-2">1. Source Video</label>
                    <div className="mt-2 w-full aspect-video bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 p-4">
                        {currentSourceUrl ? (
                            <video
                                key={currentSourceUrl}
                                src={currentSourceUrl}
                                controls
                                loop
                                className="w-full h-full rounded-lg object-contain bg-black"
                            />
                        ) : (
                            <div className="text-center text-gray-600">
                                <WorkflowIcon className="w-12 h-12 text-gray-400 mx-auto" />
                                <h3 className="font-semibold text-base mt-2 text-black">
                                    Start by Generating a Video
                                </h3>
                                <p className="text-sm mt-1">
                                    Go to the 'Text to Video' or 'Image to Video' tab to create your
                                    initial clip.
                                </p>
                                <p className="text-sm mt-2">
                                    Click the{' '}
                                    <span className="font-semibold inline-flex items-center gap-1 bg-gray-200 px-1.5 py-0.5 rounded-md text-xs">
                                        <ExtendIcon className="w-3 h-3" /> Extend Video
                                    </span>{' '}
                                    button on your result to bring it here.
                                </p>
                                <p className="text-xs text-gray-500 mt-4">
                                    (Note: Uploading external videos for extension is not currently supported.)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt-extend" className="block text-lg font-semibold">
                            2. Describe What Happens Next
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
                        id="prompt-extend"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="The figure stops under a flickering holographic ad, pulls up their collar, and looks directly at the camera as the rain intensifies."
                        className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28"
                    />
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">3. Select Video Model</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {VIDEO_MODEL_OPTIONS_EXTEND.map(({ id, displayName, usageHint }) => (
                            <div
                                key={id}
                                className="py-3 px-4 rounded-lg text-left text-sm border bg-black text-white border-black"
                            >
                                <span className="font-semibold block">{displayName}</span>
                                <span className="text-xs opacity-80">{usageHint}</span>
                                <span className="mt-1 block text-xs text-gray-200">
                                    Video extensions always use this model for stability.
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleExtendVideo}
                    disabled={isGenerationDisabled}
                    className={`w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                        isLoading ? 'animate-pulse' : ''
                    }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            Extending... <Spinner className="w-5 h-5 ml-2 text-white" />
                        </span>
                    ) : (
                        'Extend Video'
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
                ) : outputVideo ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <video
                            src={outputVideo.url}
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
                                onClick={handleUseNewVideoAsSource}
                                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <ExtendIcon /> Extend Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p className="text-lg">Your extended video will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoToVideoGenerator;
