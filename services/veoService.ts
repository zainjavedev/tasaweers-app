import { GoogleGenAI, Modality, type Video, type GenerateVideosConfig } from '@google/genai';
import { VideoAspectRatio, ImageModel, ImageAspectRatio, GeneratedVideo, VideoModel } from '../types';

const getBase64Data = (dataUrl: string): string => {
    return dataUrl.split(',')[1];
};

const getMimeType = (dataUrl: string): string | undefined => {
    return dataUrl.match(/data:(.*);base64/)?.[1];
};

export const generateVideo = async (
    prompt: string,
    aspectRatio: VideoAspectRatio,
    setLoadingMessage: (message: string) => void,
    options: { imageBase64?: string; videoToExtend?: Video; model?: VideoModel; }
): Promise<{ videoUrl: string; videoData: GeneratedVideo }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let operation;
    const videoConfig: GenerateVideosConfig = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
    };

    const model = options.model || 'veo-3.1-fast-generate-preview';

    if (options.videoToExtend) {
        setLoadingMessage("Extending your video...");
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: prompt,
            video: options.videoToExtend,
            config: videoConfig
        });
    } else if (options.imageBase64) {
        const mimeType = getMimeType(options.imageBase64);
        if (!mimeType) {
            throw new Error('Could not determine mime type from image data.');
        }
        const imageData = getBase64Data(options.imageBase64);
        
        setLoadingMessage("Initiating video generation from image...");
        operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            image: {
                imageBytes: imageData,
                mimeType: mimeType,
            },
            config: videoConfig
        });
    } else {
        setLoadingMessage("Initiating video generation from text...");
        operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            config: videoConfig
        });
    }


    setLoadingMessage("Polling for video completion... This can take a few minutes.");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        // Use a new instance for polling to ensure the latest API key is used.
        const pollerAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        operation = await pollerAi.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(operation.error.message || 'Video generation failed.');
    }

    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo?.video?.uri) {
        throw new Error("Video generation did not return any video data.");
    }
    
    const downloadLink = generatedVideo.video.uri;
    
    setLoadingMessage("Fetching generated video...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch video: ${response.statusText}. Details: ${errorText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    const returnedVideoData: GeneratedVideo = {
        video: generatedVideo.video,
        config: videoConfig
    };

    return { videoUrl, videoData: returnedVideoData };
};

export const optimizePrompt = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are an expert in writing prompts for AI image and video generation. Enhance the user's prompt to be more descriptive, vivid, and cinematic. Focus on motion, atmosphere, and lighting. Return ONLY the optimized prompt, without any introductory text or quotation marks.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });
        
        const optimizedText = response.text.trim();
        return optimizedText.replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error("Error optimizing prompt with Gemini:", error);
        throw new Error("Failed to connect to the AI to optimize the prompt.");
    }
};

export const optimizeImagePromptForVideo = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are an expert in writing prompts for AI video generation. The user has provided a prompt that was used to generate a static image. Your task is to enhance and transform this prompt to describe a dynamic video scene based on the image. Focus on adding motion, camera movement, and atmospheric effects. Return ONLY the optimized prompt, without any introductory text or quotation marks.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
            }
        });
        
        const optimizedText = response.text.trim();
        return optimizedText.replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error("Error optimizing image prompt for video:", error);
        throw new Error("Failed to connect to the AI to optimize the prompt for video.");
    }
};


export const generateImage = async (
    prompt: string,
    model: ImageModel,
    aspectRatio: ImageAspectRatio,
    referenceImage: string | null
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (model === 'imagen-4.0-generate-001') {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error('Image generation failed to produce an image.');
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;

    } else { // 'gemini-2.5-flash-image' or 'gemini-3-pro-image-preview'
        const parts: any[] = [{ text: prompt }];

        if (referenceImage) {
            const mimeType = getMimeType(referenceImage);
            const data = getBase64Data(referenceImage);
            if (!mimeType) {
                throw new Error('Could not determine mime type from reference image data.');
            }
            parts.unshift({
                inlineData: {
                    data: data,
                    mimeType: mimeType,
                },
            });
        }
        
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
                imageConfig: {
                    aspectRatio: aspectRatio
                }
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }

        throw new Error('Image generation failed with Nano Banana model.');
    }
};

export const editImage = async (
    prompt: string,
    sourceImageBase64: string,
    model: ImageModel,
    aspectRatio: ImageAspectRatio
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const mimeType = getMimeType(sourceImageBase64);
    if (!mimeType) {
        throw new Error('Could not determine mime type from image data.');
    }
    const imageData = getBase64Data(sourceImageBase64);

    if (model === 'imagen-4.0-generate-001') {
         throw new Error('Imagen model does not support image editing with this method.');
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: {
                aspectRatio: aspectRatio
            }
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const responseMimeType = part.inlineData.mimeType;
            return `data:${responseMimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error('Image editing failed.');
};