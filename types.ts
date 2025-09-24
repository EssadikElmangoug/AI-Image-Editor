
export enum Status {
    Idle = 'idle',
    Uploading = 'uploading',
    Processing = 'processing',
    Success = 'success',
    Error = 'error',
}

export interface EditConfig {
    steps: number;
    cfg: number;
    denoise: number;
}

export interface SubmitRequest extends EditConfig {
    image: File;
    prompt: string;
}

export interface SubmitResponse {
    process_id: string;
    status: 'queued';
}

interface StatusResponseBase {
    process_id: string;
}

interface StatusResponseSuccess extends StatusResponseBase {
    status: 'success';
    output: any; // The structure can be complex, using 'any' for simplicity
    file_name: string;
    error?: never;
}

interface StatusResponseProcessing extends StatusResponseBase {
    status: 'queued' | 'processing';
    output?: never;
    file_name?: never;
    error?: never;
}

interface StatusResponseError extends StatusResponseBase {
    status: 'error';
    error: string;
    output?: never;
    file_name?: never;
}

export type StatusResponse = StatusResponseSuccess | StatusResponseProcessing | StatusResponseError;
