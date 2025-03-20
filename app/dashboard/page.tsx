'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import CreateBillModal from '../components/CreateBillModal';
import AddBalanceModal from '../components/AddBalanceModal';
import BillList from '../components/BillList';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const { user, token, logout, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handleAddBalance = async () => {
    setIsAddBalanceModalOpen(true);
  };

  const handleBalanceSuccess = async () => {
    await refreshUser();
  };

  const handleLogout = () => {
    logout();
  };

  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Split Bill MVP</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Balance: Rp {user.balance.toLocaleString()}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Bills</h2>
            <div className="flex space-x-3">
              <button
                onClick={handleAddBalance}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Balance
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Bill
              </button>
            </div>
          </div>

          <BillList token={user._id} />

          <CreateBillModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            token={user._id}
          />

          <AddBalanceModal
            isOpen={isAddBalanceModalOpen}
            onClose={() => setIsAddBalanceModalOpen(false)}
            onSuccess={handleBalanceSuccess}
          />
        </div>
      </div>
    </div>
  );
} 