import { VITE_API_BASE_URL, VITE_API_KEY } from '../constants';
import { SubmitRequest, SubmitResponse, StatusResponse } from '../types';

const headers = {
    'Authorization': `Key ${VITE_API_KEY}`
};

const makeApiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server returned an unreadable error response.' }));
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        return response.json() as Promise<T>;
    } catch (error) {
        if (error instanceof TypeError) {
            // This is the most common error for CORS or network failures.
            console.error("Network/CORS Error:", error);
            throw new Error(
                `Could not connect to the API. This is likely a CORS issue or a network problem. Please ensure the server at ${VITE_API_BASE_URL} is running and configured to accept requests from this web app's origin.`
            );
        }
        // Re-throw other errors (like the custom ones we threw above)
        throw error;
    }
};


export const submitEditRequest = async (params: SubmitRequest): Promise<SubmitResponse> => {
    const formData = new FormData();
    formData.append('image', params.image);
    formData.append('prompt', params.prompt);
    formData.append('steps', params.steps.toString());
    formData.append('cfg', params.cfg.toString());
    formData.append('denoise', params.denoise.toString());

    return makeApiRequest<SubmitResponse>(`${VITE_API_BASE_URL}/api/qwen-image-edit`, {
        method: 'POST',
        // When sending FormData, we let the browser set the Content-Type header with the correct boundary.
        // We only need to provide our custom headers.
        headers: {
            'Authorization': `Key ${VITE_API_KEY}`
        },
        body: formData
    });
};

export const checkStatus = async (processId: string): Promise<StatusResponse> => {
    return makeApiRequest<StatusResponse>(`${VITE_API_BASE_URL}/api/status/${processId}`, {
        headers: headers
    });
};
