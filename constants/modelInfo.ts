export const MODEL_IDS = {
    VEO_31_FAST_PREVIEW: 'veo-3.1-fast-generate-preview',
    VEO_31_PREVIEW: 'veo-3.1-generate-preview',
    VEO_30_FAST: 'veo-3.0-fast-generate-001',
    VEO_30_STANDARD: 'veo-3.0-generate-001',
    VEO_20_STANDARD: 'veo-2.0-generate-001',
    GEMINI_FLASH: 'gemini-2.5-flash',
    GEMINI_FLASH_LITE: 'gemini-2.5-flash-lite-preview',
    GEMINI_IMAGE_FLASH: 'gemini-2.5-flash-image',
    IMAGEN_4: 'imagen-4.0-generate-001',
} as const;

export const VIDEO_MODELS = {
    VEO_31_FAST_PREVIEW: {
        id: MODEL_IDS.VEO_31_FAST_PREVIEW,
        displayName: 'Google Veo 3.1 Fast (Preview)',
        usageHint: 'Quickest turnaround from text or image prompts.',
        group: 'prompt-to-video' as const,
    },
    VEO_31_PREVIEW: {
        id: MODEL_IDS.VEO_31_PREVIEW,
        displayName: 'Google Veo 3.1 (Preview)',
        usageHint: 'Higher fidelity, ideal for extending existing clips.',
        group: 'extend' as const,
    },
    VEO_30_FAST: {
        id: MODEL_IDS.VEO_30_FAST,
        displayName: 'Google Veo 3.0 Fast',
        usageHint: 'Legacy fast mode with broad compatibility.',
        group: 'prompt-to-video' as const,
    },
    VEO_30_STANDARD: {
        id: MODEL_IDS.VEO_30_STANDARD,
        displayName: 'Google Veo 3.0',
        usageHint: 'Balanced quality for narrative clips.',
        group: 'prompt-to-video' as const,
    },
    VEO_20_STANDARD: {
        id: MODEL_IDS.VEO_20_STANDARD,
        displayName: 'Google Veo 2.0',
        usageHint: 'Great for lighter-weight explorations.',
        group: 'prompt-to-video' as const,
    },
} as const;

export const VIDEO_MODEL_OPTIONS_PROMPT = [
    VIDEO_MODELS.VEO_31_FAST_PREVIEW,
    VIDEO_MODELS.VEO_31_PREVIEW,
    VIDEO_MODELS.VEO_30_FAST,
    VIDEO_MODELS.VEO_30_STANDARD,
    VIDEO_MODELS.VEO_20_STANDARD,
] as const;

export const VIDEO_MODEL_OPTIONS_EXTEND = [VIDEO_MODELS.VEO_31_PREVIEW] as const;

export const VIDEO_MODEL_INFO = Object.values(VIDEO_MODELS).reduce(
    (acc, option) => {
        acc[option.id] = option;
        return acc;
    },
    {} as Record<(typeof VIDEO_MODELS)[keyof typeof VIDEO_MODELS]['id'], (typeof VIDEO_MODELS)[keyof typeof VIDEO_MODELS]>
);

export const IMAGE_MODEL_OPTIONS = [
    {
        id: MODEL_IDS.IMAGEN_4,
        displayName: 'Imagen 4',
        usageHint: 'High-fidelity photorealistic renders.',
    },
    {
        id: MODEL_IDS.GEMINI_IMAGE_FLASH,
        displayName: 'Gemini Image Flash',
        usageHint: 'Supports reference images and fast iterations.',
    },
] as const;

export const PROMPT_MODEL_INFO = {
    video: {
        modelId: MODEL_IDS.GEMINI_FLASH,
        displayName: 'Gemini 2.5 Flash',
        usageHint: 'Optimizes text prompts before video generation.',
    },
    image: {
        modelId: MODEL_IDS.GEMINI_FLASH,
        displayName: 'Gemini 2.5 Flash',
        usageHint: 'Refines image prompts for cinematic motion.',
    },
} as const;
