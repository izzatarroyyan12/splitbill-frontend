'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateBillModal from '../components/CreateBillModal';
import AddBalanceModal from '../components/AddBalanceModal';
import BillList from '../components/BillList';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiUser, FiBell, FiSettings, FiLogOut, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, show a message while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Redirecting to login...</div>
      </div>
    );
  }

  const handleAddBalance = () => {
    setIsAddBalanceModalOpen(true);
  };

  const handleBalanceSuccess = async () => {
    await refreshUser();
    setRefreshTrigger(prev => prev + 1);
    toast.success('Balance added successfully!');
  };

  const handleBillCreated = async () => {
    setIsCreateModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success('Bill created successfully!');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Mobile Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">SplitBill by Livin'</h1>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-white hover:bg-blue-700 rounded-full">
                <FiBell className="h-5 w-5" />
              </button>
              <button className="p-2 text-white hover:bg-blue-700 rounded-full">
                <FiSettings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-white hover:bg-blue-700 rounded-full"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-white text-sm">
            Welcome, {user.username}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4">
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white text-sm font-medium">Available Balance</h2>
                <p className="text-white text-2xl font-bold mt-1">
                  {formatCurrency(user.balance)}
                </p>
              </div>
              <button 
                onClick={handleAddBalance}
                className="bg-white bg-opacity-20 text-white px-3 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center text-sm"
              >
                <span className="font-medium mr-1">Rp</span>
                Add Balance
              </button>
            </div>
          </div>

          {/* Bills Section */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-medium text-gray-900">Your Bills</h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  New Bill
                </button>
              </div>
            </div>
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              <BillList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateBillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBillCreated={handleBillCreated}
      />
      <AddBalanceModal
        isOpen={isAddBalanceModalOpen}
        onClose={() => setIsAddBalanceModalOpen(false)}
        onSuccess={handleBalanceSuccess}
      />
    </div>
  );
} 