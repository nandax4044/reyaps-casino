import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  ChevronDown, ChevronUp, Trash2, Check, X
} from 'lucide-react';

interface WithdrawalLog {
  id: string;
  user_id: string;
  inventory_item_id: string;
  item_name: string;
  item_value: number;
  status: 'pending' | 'completed' | 'rejected' | 'cancelled';
  requested_at: string;
  completed_at?: string;
  admin_id?: string;
  admin_notes?: string;
  discord_message_id?: string;
}

interface WithdrawalLogsProps {
  onClose?: () => void;
}

const STATUS_BADGE = {
  pending: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  completed: 'bg-green-500/10 border-green-500/30 text-green-400',
  rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
  cancelled: 'bg-gray-500/10 border-gray-500/30 text-gray-400'
};

const STATUS_ICON = {
  pending: <Clock className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  cancelled: <AlertCircle className="w-4 h-4" />
};

export function WithdrawalLogs({ onClose }: WithdrawalLogsProps) {
  const [logs, setLogs] = useState<WithdrawalLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await API.getWithdrawalLogs(filter === 'all' ? undefined : filter);
      setLogs(data);
    } catch (e: any) {
      setErrorFeedback('Gagal memuat logs: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const handleCompleteWithdrawal = async (withdrawalId: string) => {
    setErrorFeedback('');
    setFeedback('');
    setActioningId(withdrawalId);

    try {
      await API.completeWithdrawal(withdrawalId);
      setFeedback('Withdrawal berhasil diselesaikan!');
      fetchLogs();
    } catch (e: any) {
      setErrorFeedback('Gagal menyelesaikan withdrawal: ' + e.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason) return;

    setErrorFeedback('');
    setFeedback('');
    setActioningId(withdrawalId);

    try {
      await API.rejectWithdrawal(withdrawalId, reason);
      setFeedback('Withdrawal berhasil ditolak!');
      fetchLogs();
    } catch (e: any) {
      setErrorFeedback('Gagal menolak withdrawal: ' + e.message);
    } finally {
      setActioningId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-400" />
              Withdrawal Logs
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border-b border-slate-700 p-4 flex gap-2 flex-wrap">
          {(['all', 'pending', 'completed', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className="bg-green-500/10 border-b border-green-500/30 text-green-400 p-4">
            {feedback}
          </div>
        )}
        {errorFeedback && (
          <div className="bg-red-500/10 border-b border-red-500/30 text-red-400 p-4">
            {errorFeedback}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Loading...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Tidak ada withdrawal logs</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredLogs.map(log => (
                <div key={log.id} className="bg-slate-800/30 hover:bg-slate-800/50 transition">
                  {/* Main Row */}
                  <div
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="p-4 cursor-pointer flex items-center gap-4"
                  >
                    <div className="flex-shrink-0">
                      {STATUS_ICON[log.status]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white truncate">
                          {log.item_name}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${STATUS_BADGE[log.status]}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Value: ${log.item_value.toFixed(2)} • Requested: {formatDate(log.requested_at)}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-slate-400">
                      {expandedId === log.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === log.id && (
                    <div className="bg-slate-900/50 border-t border-slate-700 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">User ID:</span>
                          <div className="text-white font-mono text-xs break-all">{log.user_id}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Item ID:</span>
                          <div className="text-white font-mono text-xs break-all">{log.inventory_item_id}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Withdrawal ID:</span>
                          <div className="text-white font-mono text-xs break-all">{log.id}</div>
                        </div>
                        {log.completed_at && (
                          <div>
                            <span className="text-slate-400">Completed:</span>
                            <div className="text-white text-xs">{formatDate(log.completed_at)}</div>
                          </div>
                        )}
                      </div>

                      {log.admin_notes && (
                        <div>
                          <span className="text-slate-400 text-sm">Admin Notes:</span>
                          <div className="text-white text-sm bg-slate-800/50 p-2 rounded mt-1">
                            {log.admin_notes}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {log.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleCompleteWithdrawal(log.id)}
                            disabled={actioningId === log.id}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Complete
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(log.id)}
                            disabled={actioningId === log.id}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
