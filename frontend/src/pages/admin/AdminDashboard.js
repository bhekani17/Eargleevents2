import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalCustomers: 0,
    totalEquipment: 0,
    totalPackages: 0,
    totalRevenue: 0,
    totalMessages: 0,
    newMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentData, setRecentData] = useState({
    quotes: [],
    customers: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data (quotes, equipment, customers, messages)
      const [quotesRes, customersRes, messagesAllRes, messagesNewRes] = await Promise.all([
        adminAPI.getQuotes({ limit: 5 }).catch((e) => {
          console.warn('Quotes fetch failed:', e);
          return { data: [] };
        }),
        adminAPI.getCustomers({ page: 1, limit: 5, search: '' }).catch((e) => {
          console.warn('Customers fetch failed:', e);
          return { data: [] };
        }),
        adminAPI.getMessages({ page: 1, limit: 1 }).catch((e) => {
          console.warn('Messages(all) fetch failed:', e);
          return { total: 0, items: [] };
        }),
        adminAPI.getMessages({ page: 1, limit: 1, status: 'new' }).catch((e) => {
          console.warn('Messages(new) fetch failed:', e);
          return { total: 0, items: [] };
        })
      ]);

      const quotes = quotesRes?.data || [];
      const customers = customersRes?.data || [];
      const totalMessages = typeof messagesAllRes?.total === 'number' ? messagesAllRes.total : (Array.isArray(messagesAllRes?.items) ? messagesAllRes.items.length : Array.isArray(messagesAllRes) ? messagesAllRes.length : 0);
      const newMessages = typeof messagesNewRes?.total === 'number' ? messagesNewRes.total : (Array.isArray(messagesNewRes?.items) ? messagesNewRes.items.length : Array.isArray(messagesNewRes) ? messagesNewRes.length : 0);

      setRecentData({
        quotes,
        customers
      });

      // Compute minimal stats from available data
      setStats((prev) => ({
        ...prev,
        totalQuotes: Array.isArray(quotes) ? quotes.length : 0,
        totalCustomers: Array.isArray(customers) ? customers.length : 0,
        totalMessages,
        newMessages
      }));

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const handleViewAll = (section) => {
    switch(section) {
      case 'quotes':
        navigate('/admin/quotes');
        break;
      case 'customers':
        navigate('/admin/customers');
        break;
      case 'messages':
        navigate('/admin/messages');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg text-red-600 mb-2">Error loading dashboard</div>
        <div className="text-sm text-gray-500 mb-4">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Welcome back, {adminUser?.name || 'Admin'}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Quotes</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalQuotes}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Pending: {stats.pendingQuotes}</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500 shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Total Events</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.totalBookings}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Confirmed: {stats.confirmedBookings}</span>
            <Activity className="w-4 h-4 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Customers</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalCustomers}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Active clients</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 p-6 rounded-2xl border border-amber-200/50 dark:border-amber-700/50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Revenue</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">R{stats.totalRevenue?.toLocaleString() || '0'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {stats.totalRevenue > 0 ? '+12% this month' : 'No revenue data'}
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-700/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Monthly performance and trends</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">This Year</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-600/60 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Chart visualization will appear here</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Connect your analytics service</p>
            </div>
          </div>
        </div>
      </div>


      {/* Management Sections */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-700/50 dark:to-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Latest updates across your business</p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Quotes */}
              <div className="bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200/60 dark:border-slate-600/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Quotes</h3>
                  <button
                    onClick={() => handleViewAll('quotes')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {recentData.quotes.slice(0, 3).map((quote) => (
                    <div key={quote._id} className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-slate-200/40 dark:border-slate-600/40">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{quote.customerName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{quote.eventType}</p>
                      </div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        ${quote.totalAmount || 'TBD'}
                      </div>
                    </div>
                  ))}
                  {recentData.quotes.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent quotes</p>
                  )}
                </div>
              </div>

              {/* Recent Customers */}
              <div className="bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200/60 dark:border-slate-600/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Customers</h3>
                  <button
                    onClick={() => handleViewAll('customers')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {recentData.customers.slice(0, 3).map((customer) => (
                    <div key={customer._id} className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-slate-200/40 dark:border-slate-600/40">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{customer.email}</p>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {recentData.customers.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent customers</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Summary */}
            <div className="bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200/60 dark:border-slate-600/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Messages Overview</h3>
                <button
                  onClick={() => handleViewAll('messages')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-slate-200/40 dark:border-slate-600/40">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.newMessages}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">New Messages</div>
                </div>
                <div className="text-center p-4 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-slate-200/40 dark:border-slate-600/40">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.totalMessages}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Messages</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
