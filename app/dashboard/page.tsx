'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateBillModal from '../components/CreateBillModal';
import AddBalanceModal from '../components/AddBalanceModal';
import BillList from '../components/BillList';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiUser, FiBell, FiSettings, FiLogOut, FiHome, FiCreditCard, FiPieChart } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import IPhoneFrame from '../components/IPhoneFrame';
import BillDetail from '../components/BillDetail';
import { Bill } from '../types';

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');

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

  const handleFeatureComingSoon = () => {
    toast.success('Feature coming soon! Stay tuned for updates.', {
      icon: '🚀',
      duration: 2000
    });
  };

  const handleBillClick = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDetailModalOpen(true);
  };

  const handleCloseBillDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedBill(null);
  };

  const mainContent = (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Header */}
      <header className="dashboard-header px-4 py-4 sticky top-0 z-20">
        <div className="flex justify-between items-center relative z-10">
          <h1 className="text-xl font-bold text-white">SplitBill by Livin'</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleFeatureComingSoon}
              className="tooltip dashboard-icon p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              title="Notifications"
            >
              <FiBell className="h-5 w-5" />
            </button>
            <button 
              onClick={handleFeatureComingSoon}
              className="tooltip dashboard-icon p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              title="Settings"
            >
              <FiSettings className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="dashboard-icon p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              title="Logout"
            >
              <FiLogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-1 text-white/90 text-sm font-medium relative z-10">
          Welcome, {user.username}
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="overflow-y-auto h-[calc(100%-130px)]">
        {/* Main Content */}
        <main className="px-4 pt-4 pb-24">
          {/* Balance Card */}
          <div className="mb-6">
            <div className="balance-card rounded-xl p-5">
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h2 className="text-white/90 text-sm font-medium">Available Balance</h2>
                  <p className="text-white text-2xl font-bold mt-1">
                    {formatCurrency(user.balance)}
                  </p>
                </div>
                <button 
                  onClick={handleAddBalance}
                  className="balance-action-button text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium"
                >
                  <span className="mr-2 font-medium">Rp.</span>
                  Add Balance
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button 
              onClick={handleFeatureComingSoon}
              className="quick-action-button h-20 flex flex-col items-center justify-center space-y-1"
            >
              <FiCreditCard className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">Pay Bills</span>
            </button>
            <button 
              onClick={handleFeatureComingSoon}
              className="quick-action-button h-20 flex flex-col items-center justify-center space-y-1"
            >
              <FiPieChart className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">Analytics</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="quick-action-button h-20 flex flex-col items-center justify-center space-y-1"
            >
              <FiPlus className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">New Bill</span>
            </button>
          </div>

          {/* Bills Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
            <div className="px-4 py-3 border-b border-gray-200/50">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-medium text-gray-900">Your Bills</h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="auth-button inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  New Bill
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[300px]">
              <BillList 
                refreshTrigger={refreshTrigger} 
                onBillClick={handleBillClick}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex justify-around items-center w-full">
          <button 
            onClick={() => setActiveTab('home')}
            className={`nav-button flex flex-col items-center space-y-0.5 ${activeTab === 'home' ? 'active' : 'text-gray-600'}`}
          >
            <FiHome className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button 
            onClick={handleFeatureComingSoon}
            className={`nav-button flex flex-col items-center space-y-0.5 ${activeTab === 'bills' ? 'active' : 'text-gray-600'}`}
          >
            <FiCreditCard className="h-5 w-5" />
            <span className="text-[10px]">Bills</span>
          </button>
          <button 
            onClick={handleFeatureComingSoon}
            className={`nav-button flex flex-col items-center space-y-0.5 ${activeTab === 'profile' ? 'active' : 'text-gray-600'}`}
          >
            <FiUser className="h-5 w-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );

  return (
    <IPhoneFrame>
      {mainContent}
      
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
      {selectedBill && (
        <BillDetail
          bill={selectedBill}
          isOpen={isDetailModalOpen}
          onClose={handleCloseBillDetail}
          onUpdate={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}
    </IPhoneFrame>
  );
} 