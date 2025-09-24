import React, { ChangeEvent } from 'react';

interface SliderProps {
    label: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, min, max, step = 1, value, onChange }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(parseFloat(e.target.value));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-400">{label}</label>
                <span className="text-sm font-mono bg-gray-700 text-white px-2 py-0.5 rounded">{value.toFixed(step < 1 ? 1 : 0)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
        </div>
    );
};
