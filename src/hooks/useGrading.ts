import { useState, useCallback } from 'react';

export interface GradingResult {
  tcgmodel: string;
  cardInfo: {
    name: string;
    number: string;
    set: string;
    year: string;
    type: string;
  };
  front: {
    side: string;
    cardInfo: {
      name: string;
      number: string;
      set: string;
      year: string;
      type: string;
    };
    grades: {
      overall: {
        grade: number;
        description: string;
        defects: any[];
      };
      corners: {
        grade: number;
        description: string;
        defects: any[];
      };
      edges: {
        grade: number;
        description: string;
        defects: any[];
      };
      surface: {
        grade: number;
        description: string;
        defects: any[];
      };
      holographic?: {
        grade: number;
        description: string;
        defects: any[];
      };
    };
    timestamp: string;
  };
  back: {
    side: string;
    cardInfo: {
      name: string;
      number: string;
      set: string;
      year: string;
      type: string;
    };
    grades: {
      overall: {
        grade: number;
        description: string;
        defects: any[];
      };
      corners: {
        grade: number;
        description: string;
        defects: any[];
      };
      edges: {
        grade: number;
        description: string;
        defects: any[];
      };
      surface: {
        grade: number;
        description: string;
        defects: any[];
      };
      holographic?: {
        grade: number;
        description: string;
        defects: any[];
      };
    };
    timestamp: string;
  };
  combined: {
    overall: number;
    summary: string;
  };
  timestamp: string;
  images: {
    frontUrl: string;
    backUrl: string;
  };
}

export interface StreamMessage {
  status?: string;
  progress?: number;
  result?: GradingResult;
  error?: string;
  details?: string;
}

export interface UseGradingReturn {
  grade: (formData: FormData) => void;
  result: GradingResult | null;
  loading: boolean;
  error: string | null;
  status: string | null;
  progress: number;
  resetGrading: () => void;
}

export function useGrading(): UseGradingReturn {
  const [result, setResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const resetGrading = useCallback(() => {
    setResult(null);
    setLoading(false);
    setError(null);
    setStatus(null);
    setProgress(0);
  }, []);

  const grade = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setStatus('Initializing AI grading...');
    setProgress(0);

    try {
      const response = await fetch('/api/grading/stream-v4', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        // Handle 402 (Payment Required) specifically
        if (response.status === 402) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Insufficient credits or grade limit reached');
          } catch (e) {
            console.error('Error parsing 402 response:', e);
            throw new Error('Insufficient credits or grade limit reached');
          }
        }
        
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        } catch (e) {
          // Error parsing response JSON
          console.error('Error parsing response:', e);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Check if response is JSON (error) or SSE stream
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Handle JSON error response
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // Handle both SSE format and plain JSON format
          if (line.startsWith('data: ')) {
            try {
              const data: StreamMessage = JSON.parse(line.slice(6));
              
              if (data.error) {
                // Use the detailed error message if available
                const errorMessage = data.details || data.error;
                setError(errorMessage);
                setLoading(false);
                return; // Exit the function completely
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          } else if (line.startsWith('{')) {
            // Handle plain JSON response (error case)
            try {
              const data = JSON.parse(line);
              if (data.error) {
                setError(data.error);
                setLoading(false);
                return; // Exit the function completely
              }
            } catch (e) {
              console.error('Error parsing JSON data:', e);
            }
          }
          
          // Continue processing SSE data if we have it
          if (line.startsWith('data: ')) {
            try {
              const data: StreamMessage = JSON.parse(line.slice(6));
              
              if (data.status) {
                setStatus(data.status);
              }

              if (data.progress !== undefined) {
                setProgress(data.progress);
              }

              if (data.result) {
                setResult(data.result);
                setLoading(false);
                setStatus('Grading complete!');
                setProgress(100);
              }
            } catch (e) {
              // Error parsing SSE data
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      // Error during grading
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  }, []);

  return {
    grade,
    result,
    loading,
    error,
    status,
    progress,
    resetGrading,
  };
}