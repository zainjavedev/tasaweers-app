import type { Video, GenerateVideosConfig } from "@google/genai";
import { IMAGE_MODEL_OPTIONS, VIDEO_MODELS } from "./constants/modelInfo";

export type VideoAspectRatio = '16:9' | '9:16';
export type ImageAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '4:5';
export type ImageModel = (typeof IMAGE_MODEL_OPTIONS)[number]['id'];
export type VideoModel = (typeof VIDEO_MODELS)[keyof typeof VIDEO_MODELS]['id'];

export type GeneratedVideo = {
    video: Video;
    config: GenerateVideosConfig;
    modelId: VideoModel;
};

export type Tab = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video' | 'video-to-video';
