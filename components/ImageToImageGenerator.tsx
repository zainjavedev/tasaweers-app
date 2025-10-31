import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { editImage, optimizePrompt } from '../services/veoService';
import Spinner from './Spinner';
import LoadingPlaceholder from './LoadingPlaceholder';
import { DownloadIcon, EditIcon, OptimizeIcon } from './Icons';

type ImageToImageGeneratorProps = {
    initialImageBase64: string | null;
    initialPrompt: string | null;
    onUseForVideo: (imageBase64: string, prompt: string) => void;
};

const ImageToImageGenerator: React.FC<ImageToImageGeneratorProps> = ({
    initialImageBase64,
    initialPrompt,
    onUseForVideo,
}) => {
    const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
    const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialImageBase64) {
            setSourceImageBase64(initialImageBase64);
            setGeneratedImage(null);
            setError(null);
            setSourceImageFile(null);
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
            setError(e.message || 'Failed to optimize prompt.');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt || !sourceImageBase64) {
            setError('Please provide an image and a prompt.');
            return;
        }
        setIsLoading(true);
        setGeneratedImage(null);
        setError(null);

        if (window.innerWidth < 1024) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            const resultImage = await editImage(prompt, sourceImageBase64);
            setGeneratedImage(resultImage);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during image editing.');
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
        setPrompt('');
    };

    const isGenerationDisabled = isLoading || isOptimizing || !prompt || !sourceImageBase64;

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <label htmlFor="image-upload-edit" className="block text-lg font-semibold mb-2">
                        1. Source Image
                    </label>
                    <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {sourceImageBase64 ? (
                                <img
                                    src={sourceImageBase64}
                                    alt="Upload preview"
                                    className="mx-auto h-48 w-auto rounded-lg object-contain"
                                />
                            ) : (
                                <>
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </>
                            )}
                            <div className="flex text-sm justify-center">
                                <label
                                    htmlFor="file-upload-edit"
                                    className="relative cursor-pointer bg-gray-200 rounded-md font-semibold text-black hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-black px-3 py-1"
                                >
                                    <span>
                                        {sourceImageFile || sourceImageBase64 ? 'Change image' : 'Upload an image'}
                                    </span>
                                    <input
                                        id="file-upload-edit"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt-edit" className="block text-lg font-semibold">
                            2. Describe Your Edit
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
                        id="prompt-edit"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Add a futuristic helmet to the main figure."
                        className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28"
                    />
                </div>
                <button
                    onClick={handleGenerate}
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
                        'Generate Edit'
                    )}
                </button>
            </div>
            <div
                ref={outputRef}
                className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px]"
            >
                {isLoading ? (
                    <LoadingPlaceholder message="Applying your edits..." />
                ) : error ? (
                    <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                ) : generatedImage ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <img
                            src={generatedImage}
                            alt="Edited image"
                            className="w-full h-full rounded-lg bg-gray-100 object-contain flex-1"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <button
                                onClick={handleDownloadImage}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <DownloadIcon /> Download
                            </button>
                            <button
                                onClick={handleUseNewAsSource}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <EditIcon /> Edit Again
                            </button>
                            <button
                                onClick={() => onUseForVideo(generatedImage, prompt)}
                                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Animate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p className="text-lg">Your edited image will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageToImageGenerator;
