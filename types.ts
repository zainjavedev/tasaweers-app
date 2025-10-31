import type { Video, GenerateVideosConfig } from "@google/genai";

export type VideoAspectRatio = '16:9' | '9:16';
export type ImageAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
export type ImageModel = 'gemini-2.5-flash-image' | 'imagen-4.0-generate-001';

export type GeneratedVideo = {
    video: Video;
    config: GenerateVideosConfig;
};

export type Tab = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video' | 'video-to-video';