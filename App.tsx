import React, { useState } from 'react';
import TextToImageGenerator from './components/TextToImageGenerator';
import ImageToImageGenerator from './components/ImageToImageGenerator';
import TextToVideoGenerator from './components/TextToVideoGenerator';
import ImageToVideoGenerator from './components/ImageToVideoGenerator';
import VideoToVideoGenerator from './components/VideoToVideoGenerator';
import { GeneratedVideo, Tab } from './types';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('text-to-image');

    const [imageForVideo, setImageForVideo] = useState<string | null>(null);
    const [promptForVideo, setPromptForVideo] = useState<string | null>(null);

    const [imageForEditing, setImageForEditing] = useState<string | null>(null);
    const [promptForEditing, setPromptForEditing] = useState<string | null>(null);

    const [videoForExtension, setVideoForExtension] = useState<GeneratedVideo | null>(null);

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

    const TabButton: React.FC<{ tabId: Tab; children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors rounded-t-lg border-b-2 ${
                activeTab === tabId
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-100 hover:text-black'
            }`}
        >
            {children}
        </button>
    );

    const apiKeyMissing = !process.env.API_KEY;

    return (
        <div className="min-h-screen bg-white text-black flex flex-col items-center p-2 sm:p-4 lg:p-8">
            <div className="w-full max-w-7xl">
                <header className="text-center my-6 md:my-8">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black">
                        Tasaweers
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Generate stunning images and bring them to life as dynamic videos.
                    </p>
                </header>

                {apiKeyMissing && (
                    <div className="mb-4 text-center text-red-700 bg-red-100 p-3 rounded-lg border border-red-200">
                        Missing GEMINI_API_KEY. Set it in your environment before running the app.
                    </div>
                )}

                <div className="w-full border-b border-gray-300 mb-6 lg:mb-8">
                    <div className="flex overflow-x-auto whitespace-nowrap mobile-scroll-x-hidden">
                        <TabButton tabId="text-to-image">1. Text to Image</TabButton>
                        <TabButton tabId="image-to-image">2. Image to Image</TabButton>
                        <TabButton tabId="text-to-video">3. Text to Video</TabButton>
                        <TabButton tabId="image-to-video">4. Image to Video</TabButton>
                        <TabButton tabId="video-to-video">5. Video to Video</TabButton>
                    </div>
                </div>

                <main>
                    {activeTab === 'text-to-image' && (
                        <TextToImageGenerator
                            onUseForVideo={handleUseForVideo}
                            onUseForEditing={handleUseForEditing}
                        />
                    )}
                    {activeTab === 'image-to-image' && (
                        <ImageToImageGenerator
                            initialImageBase64={imageForEditing}
                            initialPrompt={promptForEditing}
                            onUseForVideo={handleUseForVideo}
                        />
                    )}
                    {activeTab === 'text-to-video' && (
                        <TextToVideoGenerator onGoToExtend={handleGoToExtend} />
                    )}
                    {activeTab === 'image-to-video' && (
                        <ImageToVideoGenerator
                            initialImageBase64={imageForVideo}
                            initialPrompt={promptForVideo}
                            onGoToExtend={handleGoToExtend}
                        />
                    )}
                    {activeTab === 'video-to-video' && (
                        <VideoToVideoGenerator initialVideo={videoForExtension} />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
