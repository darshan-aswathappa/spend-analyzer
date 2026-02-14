import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '@/lib/apiClient';
import type { AppDispatch, RootState } from '@/app/store';
import { setStatements, addStatement, removeStatement, setUploading, setError } from './statementsSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { BankStatement } from '@/types';

export function StatementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, uploading, error } = useSelector((state: RootState) => state.statements);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get('/statements');
        dispatch(setStatements(res.data));
      } catch {
        // silent
      }
    }
    load();
  }, [dispatch]);

  async function handleUpload(file: File) {
    if (!file || file.type !== 'application/pdf') {
      dispatch(setError('Please upload a PDF file.'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      dispatch(setError('File must be under 20MB.'));
      return;
    }

    dispatch(setUploading(true));
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('statement', file);

    try {
      const res = await apiClient.post('/statements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(addStatement(res.data.statement));
      const mins = res.data.estimatedMinutes ?? 1;
      setUploadSuccess(
        `${file.name} queued for processing. Should be ready in ~${mins} minute${mins !== 1 ? 's' : ''}. You can upload more files.`
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.error ||
        axiosErr?.message ||
        'Upload failed';
      dispatch(setError(msg));
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiClient.delete(`/statements/${id}`);
      dispatch(removeStatement(id));
      // Refetch to get the backend's promoted default
      const res = await apiClient.get('/statements');
      dispatch(setStatements(res.data));
    } catch {
      // silent
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await apiClient.patch(`/statements/${id}/set-default`);
      // Update local state: mark the chosen one as default
      const updated = items.map((s) => ({ ...s, is_default: s.id === id }));
      dispatch(setStatements(updated));
    } catch {
      // silent
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Upload statement</h2>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
            dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Parsing with AI...</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">This may take 20–60 seconds for scanned documents</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Drop PDF here or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">PDF bank statements only · Max 20MB</p>
            </div>
          )}
        </div>

        {uploadSuccess && (
          <div className="flex items-center gap-2 mt-3 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2.5 rounded-lg">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {uploadSuccess}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-4 py-2.5 rounded-lg">{error}</p>
        )}
      </div>

      {/* Statements list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Uploaded statements</h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              No statements uploaded yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((stmt) => (
              <StatementRow
                key={stmt.id}
                statement={stmt}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatementRow({
  statement,
  onDelete,
  onSetDefault,
}: {
  statement: BankStatement;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const isProcessing = statement.processing_status === 'pending' || statement.processing_status === 'processing';
  const isFailed = statement.processing_status === 'failed';

  return (
    <Card className={cn(statement.is_default && 'ring-2 ring-blue-500 ring-offset-1')}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
            isFailed ? 'bg-red-50 dark:bg-red-900/30' : isProcessing ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'
          )}>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
            ) : isFailed ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{statement.filename}</p>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
              {isProcessing && (
                <Badge variant="secondary" className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Processing...
                </Badge>
              )}
              {isFailed && (
                <Badge variant="secondary" className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  Failed
                </Badge>
              )}
              {!isProcessing && !isFailed && statement.bank_name && (
                <Badge variant="secondary" className="text-xs">{statement.bank_name}</Badge>
              )}
              {!isProcessing && !isFailed && statement.statement_period_start && statement.statement_period_end && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(statement.statement_period_start)} – {formatDate(statement.statement_period_end)}
                </span>
              )}
              {isFailed && statement.processing_error && (
                <span className="text-xs text-red-500 dark:text-red-400 truncate">{statement.processing_error}</span>
              )}
            </div>
          </div>
          {/* Delete button always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 dark:text-gray-500 hover:text-red-600 shrink-0"
            onClick={() => onDelete(statement.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Actions row */}
        {!isProcessing && !isFailed && (
          <div className="flex items-center gap-2 mt-2 pl-11">
            {statement.is_default ? (
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs">Active</Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600"
                onClick={(e) => { e.stopPropagation(); onSetDefault(statement.id); }}
              >
                Set as active
              </Button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{formatDate(statement.uploaded_at)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
