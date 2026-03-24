'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  MessageCircle,
  Filter,
  Search,
  Send,
  BarChart3
} from 'lucide-react';
import { 
  getAllSupportTickets, 
  updateTicketStatus, 
  addAdminReply,
  getTicketStatistics,
  SupportTicket 
} from '@/services/supportTicketService';
import Toast from '@/components/vendor/Toast';

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statistics, setStatistics] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Reply form state
  const [replyForm, setReplyForm] = useState({
    message: '',
    status: '' as SupportTicket['status'] | ''
  });
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadTickets();
    loadStatistics();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const fetchedTickets = await getAllSupportTickets();
      setTickets(fetchedTickets);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load support tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getTicketStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      setToast({ message: 'Ticket status updated successfully', type: 'success' });
      await loadTickets();
      await loadStatistics();
      
      // Update selected ticket if it's the one being updated
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update ticket status', type: 'error' });
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyForm.message.trim()) return;

    try {
      setReplying(true);
      await addAdminReply(
        selectedTicket.id, 
        replyForm.message,
        replyForm.status || undefined
      );
      
      setToast({ message: 'Reply sent successfully', type: 'success' });
      setReplyForm({ message: '', status: '' });
      await loadTickets();
      await loadStatistics();
      
      // Update selected ticket
      const updatedTicket = {
        ...selectedTicket,
        adminReply: replyForm.message,
        status: replyForm.status || selectedTicket.status,
        repliedAt: new Date()
      };
      setSelectedTicket(updatedTicket);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to send reply', type: 'error' });
    } finally {
      setReplying(false);
    }
  };

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets Management</h1>
        <p className="text-gray-600 mt-1">Manage vendor support requests and provide assistance</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.open}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{statistics.resolved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{statistics.highPriority}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Support Tickets</h3>
            <p className="text-gray-500">No tickets match your current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-purple-500 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Ticket ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Vendor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket, index) => (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">
                        #{ticket.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{ticket.vendorName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {ticket.message}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusUpdate(ticket.id, e.target.value as SupportTicket['status'])}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(ticket.status)}`}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ticket.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        View & Reply
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Reply Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Ticket #{selectedTicket.id.slice(0, 8)} • From {selectedTicket.vendorName} • Created {selectedTicket.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTicket.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority} priority
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-800">Vendor Message</span>
                      <span className="text-sm text-gray-500">
                        {selectedTicket.createdAt.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  {selectedTicket.adminReply && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Your Reply</span>
                        {selectedTicket.repliedAt && (
                          <span className="text-sm text-blue-600">
                            {selectedTicket.repliedAt.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-blue-700 whitespace-pre-wrap">{selectedTicket.adminReply}</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  <form onSubmit={handleReply} className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-4">Send Reply</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update Status (Optional)
                        </label>
                        <select
                          value={replyForm.status}
                          onChange={(e) => setReplyForm({ ...replyForm, status: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        >
                          <option value="">Keep current status</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reply Message *
                        </label>
                        <textarea
                          value={replyForm.message}
                          onChange={(e) => setReplyForm({ ...replyForm, message: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                          placeholder="Type your reply to the vendor..."
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(null)}
                          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={replying || !replyForm.message.trim()}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          {replying ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}