
import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { submitEditRequest, checkStatus } from './services/api';
import { VITE_API_BASE_URL, VITE_API_KEY } from './constants';
import { Status, StatusResponse, EditConfig } from './types';
import { UploadIcon, DownloadIcon, SparklesIcon, ExclamationIcon, LoadingSpinnerIcon } from './components/Icons';
import { Slider } from './components/Slider';

const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [config, setConfig] = useState<EditConfig>({ steps: 20, cfg: 2.5, denoise: 1.0 });
    
    const [status, setStatus] = useState<Status>(Status.Idle);
    const [statusMessage, setStatusMessage] = useState<string>('Ready to create magic.');
    const [processId, setProcessId] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [fetchedResultBlobUrl, setFetchedResultBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setResultImageUrl(null);
        if (fetchedResultBlobUrl) {
            URL.revokeObjectURL(fetchedResultBlobUrl);
        }
        setFetchedResultBlobUrl(null);
        setStatus(Status.Idle);
        setError(null);
        setStatusMessage('Ready to create magic.');
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            resetState();
        }
    };

    const handleConfigChange = (key: keyof EditConfig, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!imageFile || !prompt) {
            setError('Please select an image and provide a prompt.');
            return;
        }
        
        resetState();
        setStatus(Status.Uploading);
        setStatusMessage('Uploading image...');

        try {
            const data = await submitEditRequest({ image: imageFile, prompt, ...config });
            setProcessId(data.process_id);
            setStatus(Status.Processing);
            setStatusMessage('Image queued for processing...');
        } catch (err) {
            setStatus(Status.Error);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during submission.');
        }
    };
    
    const pollStatus = useCallback(async () => {
        if (!processId) return;

        try {
            const data: StatusResponse = await checkStatus(processId);
            if (data.status === 'success' && data.file_name) {
                setResultImageUrl(`${VITE_API_BASE_URL}/api/download/${data.file_name}`);
                setProcessId(null);
            } else if (data.status === 'error' && data.error) {
                setStatus(Status.Error);
                setError(data.error);
                setProcessId(null);
            } else {
                 setStatusMessage('Processing your image...');
                setTimeout(pollStatus, 2500);
            }
        } catch (err) {
            setStatus(Status.Error);
            setError(err instanceof Error ? err.message : 'Failed to check status.');
            setProcessId(null);
        }
    }, [processId]);

    useEffect(() => {
        if (status === Status.Processing && processId) {
            const timeoutId = setTimeout(pollStatus, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [status, processId, pollStatus]);

    useEffect(() => {
        let objectUrl: string | null = null;
        const fetchImage = async () => {
            if (resultImageUrl) {
                setStatusMessage('Fetching final image...');
                try {
                    const response = await fetch(resultImageUrl, {
                        headers: { 'Authorization': `Key ${VITE_API_KEY}` }
                    });
                    if (!response.ok) {
                        throw new Error(`Download for preview failed (status: ${response.status})`);
                    }
                    const blob = await response.blob();
                    objectUrl = URL.createObjectURL(blob);
                    setFetchedResultBlobUrl(objectUrl);
                    setStatus(Status.Success);
                    setStatusMessage('Your masterpiece is ready!');
                } catch (err) {
                    setStatus(Status.Error);
                    setError(err instanceof Error ? err.message : 'Could not download result image.');
                }
            }
        };

        fetchImage();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [resultImageUrl]);


    const handleDownload = async () => {
        if (!resultImageUrl) return;

        try {
            const response = await fetch(resultImageUrl, {
                headers: { 'Authorization': `Key ${VITE_API_KEY}` }
            });
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = resultImageUrl.split('/').pop() || 'edited-image.png';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not download image.');
        }
    };
    
    const isProcessing = status === Status.Uploading || status === Status.Processing;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">AI Image Editor</h1>
                <p className="text-lg text-gray-400 mt-2">Transform your images with the power of AI.</p>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
                {/* Control Panel */}
                <div className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl ring-1 ring-white/10 flex flex-col space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">1. Upload Image</label>
                        <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors duration-300">
                             <input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 rounded-md" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <UploadIcon className="w-10 h-10 text-gray-500" />
                                    <p className="mt-2 text-gray-400">Click or drag file to upload</p>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-grow">
                        <div>
                             <label htmlFor="prompt" className="text-sm font-medium text-gray-300 mb-2 block">2. Describe Your Edit</label>
                             <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="e.g., make the t-shirt red, add a cat on the sofa"
                                 className="w-full bg-gray-900/70 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                        </div>

                        <div>
                             <h3 className="text-sm font-medium text-gray-300 mb-4">3. Adjust Parameters (Optional)</h3>
                             <div className="space-y-4">
                                <Slider label="Steps" min={1} max={100} value={config.steps} onChange={(val) => handleConfigChange('steps', val)} />
                                <Slider label="CFG Scale" min={0.1} max={20} step={0.1} value={config.cfg} onChange={(val) => handleConfigChange('cfg', val)} />
                                <Slider label="Denoise" min={0.1} max={1.0} step={0.1} value={config.denoise} onChange={(val) => handleConfigChange('denoise', val)} />
                             </div>
                        </div>
                        
                        <div className="pt-4 mt-auto">
                            <button type="submit" disabled={!imageFile || !prompt || isProcessing}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-100">
                                {isProcessing ? (
                                    <>
                                        <LoadingSpinnerIcon className="w-5 h-5 mr-2" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5 mr-2" />
                                        <span>Generate Image</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Result Panel */}
                <div className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl ring-1 ring-white/10 flex flex-col items-center justify-center min-h-[400px] lg:min-h-0">
                    <div className="w-full text-center">
                        <h2 className="text-2xl font-bold mb-2 text-white">Result</h2>
                         <p className="text-gray-400 mb-6">{statusMessage}</p>
                        
                        {isProcessing && <LoadingSpinnerIcon className="w-12 h-12 text-indigo-500 mx-auto" />}
                        
                        {error && (
                            <div className="bg-red-900/50 text-red-300 border border-red-700 rounded-lg p-4 flex items-center">
                                <ExclamationIcon className="w-6 h-6 mr-3"/>
                                <span>{error}</span>
                            </div>
                        )}

                        {status === Status.Success && fetchedResultBlobUrl && (
                             <div className="animate-fade-in w-full max-w-lg mx-auto">
                                <img src={fetchedResultBlobUrl} alt="Edited Result" className="w-full h-auto rounded-lg shadow-md" />
                            </div>
                        )}

                        {status === Status.Success && fetchedResultBlobUrl && (
                            <div className="mt-6 w-full max-w-xs mx-auto">
                                <button onClick={handleDownload} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300">
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    <span>Download Result</span>
                                </button>
                            </div>
                        )}
                        
                         {status === Status.Idle && !imagePreview && (
                            <div className="text-gray-500">
                                <SparklesIcon className="w-16 h-16 mx-auto" />
                                <p className="mt-4">Your generated image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
