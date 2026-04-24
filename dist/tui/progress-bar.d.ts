import React from "react";
interface ProgressBarProps {
    current: number;
    total: number;
    width?: number;
}
export declare function ProgressBar({ current, total, width }: ProgressBarProps): React.ReactElement;
export {};
