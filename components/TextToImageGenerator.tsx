import React, { ChangeEvent, useRef, useState } from 'react';
import { ImageAspectRatio, ImageModel } from '../types';
import { generateImage, optimizePrompt } from '../services/veoService';
import Spinner from './Spinner';
import LoadingPlaceholder from './LoadingPlaceholder';
import { DownloadIcon, EditIcon, OptimizeIcon } from './Icons';

type TextToImageGeneratorProps = {
    onUseForVideo: (imageBase64: string, prompt: string) => void;
    onUseForEditing: (imageBase64: string, prompt: string) => void;
};

const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({
    onUseForVideo,
    onUseForEditing,
}) => {
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

    const handleReferenceImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageModel('gemini-2.5-flash-image');
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleRemoveReferenceImage = () => {
        setReferenceImage(null);
    };

    const handleModelChange = (newModel: ImageModel) => {
        if (referenceImage && newModel === 'imagen-4.0-generate-001') {
            if (
                window.confirm(
                    'Switching to the Imagen model will remove your reference image. Do you want to continue?'
                )
            ) {
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
            setError(e.message || 'Failed to optimize prompt.');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!prompt) {
            setError('Please provide a prompt.');
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
            setError(e.message || 'An unknown error occurred during image generation.');
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
            <div className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col gap-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt" className="block text-lg font-semibold">
                            1. Describe Your Image
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
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cyberpunk cityscape at night, rain-slicked streets reflecting neon signs, a lone figure in a trench coat walks towards the camera. 4K, photorealistic, cinematic."
                        className="w-full bg-white border-gray-300 rounded-lg p-3 text-black border focus:ring-2 focus:ring-black focus:border-black transition duration-200 h-28"
                    />
                </div>
                <div>
                    <button
                        onClick={() => setIsReferenceSectionOpen(!isReferenceSectionOpen)}
                        className="w-full flex justify-between items-center text-lg font-semibold text-left py-2"
                    >
                        <span>
                            2. Add Reference Image{' '}
                            <span className="text-sm font-normal text-gray-500">(Optional)</span>
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className={`w-5 h-5 transition-transform duration-200 ${
                                isReferenceSectionOpen ? 'transform rotate-180' : ''
                            }`}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    {isReferenceSectionOpen && (
                        <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {referenceImage ? (
                                    <div className="relative group mx-auto">
                                        <img
                                            src={referenceImage}
                                            alt="Reference preview"
                                            className="mx-auto h-24 w-auto rounded-lg object-contain"
                                        />
                                        <button
                                            onClick={handleRemoveReferenceImage}
                                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-gray-600 hover:text-black focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity border border-gray-300 shadow-sm"
                                            title="Remove image"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
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
                                )}
                                <div className="flex text-sm justify-center">
                                    <label
                                        htmlFor="file-upload-ref"
                                        className="relative cursor-pointer bg-gray-200 rounded-md font-semibold text-black hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-black px-3 py-1"
                                    >
                                        <span>{referenceImage ? 'Change image' : 'Upload an image'}</span>
                                        <input
                                            id="file-upload-ref"
                                            name="file-upload-ref"
                                            type="file"
                                            className="sr-only"
                                            onChange={handleReferenceImageChange}
                                            accept="image/*"
                                        />
                                    </label>
                                </div>
                                {!referenceImage && (
                                    <p className="text-xs text-gray-500 pt-1">
                                        Using a reference will switch to the Nano Banana model.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">3. Select Model</label>
                    <div className="flex space-x-2">
                        {(['imagen-4.0-generate-001', 'gemini-2.5-flash-image'] as ImageModel[]).map(
                            (model) => (
                                <button
                                    key={model}
                                    onClick={() => handleModelChange(model)}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                                        imageModel === model
                                            ? 'bg-black text-white'
                                            : 'bg-white hover:bg-gray-100 text-black border border-gray-300'
                                    }`}
                                >
                                    {model === 'imagen-4.0-generate-001'
                                        ? 'Imagen 4'
                                        : 'Gemini Image Flash'}
                                </button>
                            )
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">4. Select Aspect Ratio</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            {
                                value: '16:9' as ImageAspectRatio,
                                label: 'Landscape 16:9',
                                useCase: 'YouTube hero, LinkedIn banners',
                            },
                            {
                                value: '9:16' as ImageAspectRatio,
                                label: 'Portrait 9:16',
                                useCase: 'Instagram Reels, Shorts, TikTok',
                            },
                            {
                                value: '1:1' as ImageAspectRatio,
                                label: 'Square 1:1',
                                useCase: 'Instagram feed, Pinterest tiles',
                            },
                            {
                                value: '4:5' as ImageAspectRatio,
                                label: 'Portrait 4:5',
                                useCase: 'Instagram posts, Facebook feed',
                            },
                        ].map(({ value, label, useCase }) => (
                            <button
                                key={value}
                                onClick={() => setAspectRatio(value)}
                                className={`py-3 px-4 rounded-lg text-left text-sm transition-colors ${
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
                <button
                    onClick={handleGenerateImage}
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
                        'Generate Image'
                    )}
                </button>
            </div>
            <div
                ref={outputRef}
                className="w-full lg:w-1/2 bg-white border border-gray-300 p-4 lg:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[400px]"
            >
                {isLoading ? (
                    <LoadingPlaceholder message="Generating your image..." />
                ) : generatedImage ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <img
                            src={generatedImage}
                            alt="Generated artwork"
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
                                onClick={() => onUseForEditing(generatedImage, prompt)}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <EditIcon /> Edit
                            </button>
                            <button
                                onClick={() => onUseForVideo(generatedImage, prompt)}
                                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Animate
                            </button>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p className="text-lg">Your generated image will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextToImageGenerator;
