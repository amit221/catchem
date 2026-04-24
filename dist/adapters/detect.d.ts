export interface DetectedPlatform {
    name: string;
    detected: boolean;
    configPath: string;
}
export declare function detectClaudeCode(): DetectedPlatform;
export declare function detectAllPlatforms(): DetectedPlatform[];
