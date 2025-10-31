import React from 'react';
import Spinner from './Spinner';

type LoadingPlaceholderProps = {
    message: string;
    showProgressBar?: boolean;
    subtext?: string;
};

const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({
    message,
    showProgressBar = false,
    subtext,
}) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gray-100 rounded-lg relative overflow-hidden shimmer-bg p-4 min-h-[200px]">
        <Spinner className="w-12 h-12 mx-auto mb-4 text-black" />
        <p className="text-lg font-semibold text-gray-800">{message}</p>
        {subtext && <p className="text-sm text-gray-500 mt-2">{subtext}</p>}
        {showProgressBar && (
            <div className="w-3/4 max-w-sm mt-4 h-1 bg-gray-300 rounded-full overflow-hidden relative">
                <div className="progress-bar-indeterminate w-full h-full"></div>
            </div>
        )}
    </div>
);

export default LoadingPlaceholder;

