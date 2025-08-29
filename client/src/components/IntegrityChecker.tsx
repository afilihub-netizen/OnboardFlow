import React, { useEffect, useState } from 'react';
import { X, Minimize2, Maximize2, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface IntegrityReport {
  integrity: number;
  summary: {
    originalTransactions: number;
    reExtractedTransactions: number;
    matchedTransactions: number;
    missingTransactions: number;
    extraTransactions: number;
    valueDifferences: number;
  };
  status: 'excellent' | 'good' | 'acceptable' | 'needs_review';
  issues: string[];
  recommendations: string[];
}

interface VerificationProgress {
  step: string;
  progress: number;
  message: string;
  error?: string;
  report?: IntegrityReport;
  comparison?: any;
}

interface IntegrityCheckerProps {
  sessionId: string;
  originalText: string;
  extractedTransactions: any[];
  onClose: () => void;
  onComplete?: (report: IntegrityReport) => void;
}

const IntegrityChecker: React.FC<IntegrityCheckerProps> = ({
  sessionId,
  originalText,
  extractedTransactions,
  onClose,
  onComplete
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Preparando verificação...');
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startVerification();
  }, [sessionId]);

  const startVerification = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      // Iniciar verificação em background
      const response = await fetch('/api/verify-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originalText,
          extractedTransactions,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao iniciar verificação');
      }

      // Conectar ao stream de progresso
      connectToProgressStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsVerifying(false);
    }
  };

  const connectToProgressStream = () => {
    const eventSource = new EventSource(`/api/verification-progress/${sessionId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: VerificationProgress = JSON.parse(event.data);
        
        setProgress(data.progress);
        setMessage(data.message);

        if (data.error) {
          setError(data.error);
          setIsVerifying(false);
          eventSource.close();
        } else if (data.step === 'completed' && data.report) {
          setReport(data.report);
          setIsVerifying(false);
          eventSource.close();
          onComplete?.(data.report);
        }
      } catch (err) {
        console.error('Erro parsing progress data:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
      setIsVerifying(false);
    };

    return eventSource;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'acceptable':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'needs_review':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'acceptable':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'needs_review':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setIsMinimized(false)}
          data-testid="minimized-integrity-checker"
        >
          <div className="flex items-center space-x-2">
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Verificando... {progress}%
                </span>
              </>
            ) : report ? (
              <>
                {getStatusIcon(report.status)}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Integridade: {report.integrity}%
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">Erro na verificação</span>
              </>
            )}
            <Maximize2 className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-96 max-h-[500px] overflow-hidden" data-testid="integrity-checker">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verificação de Integridade
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              data-testid="button-minimize"
            >
              <Minimize2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              data-testid="button-close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[400px]">
          {isVerifying && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {message}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {progress}% concluído
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Erro na Verificação</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={startVerification}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                data-testid="button-retry-verification"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {report && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(report.status)}`}>
                {getStatusIcon(report.status)}
                <span className="text-sm font-medium">
                  Integridade: {report.integrity}%
                </span>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400">Transações</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {report.summary.matchedTransactions}/{report.summary.originalTransactions}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400">Precisão</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {report.integrity}%
                  </div>
                </div>
              </div>

              {/* Issues */}
              {report.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Questões Identificadas:
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {report.issues.map((issue, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Recomendações:
                </h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrityChecker;