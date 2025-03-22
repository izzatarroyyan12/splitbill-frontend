'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Bill } from '../types';
import CreateBillModal from './CreateBillModal';
import { FiPlus, FiUser, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
    fetchBalance();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await apiService.getBills();
      setBills(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await apiService.getBalance();
      setBalance(response.balance);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch balance');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">SplitBill by Livin'</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FiLogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white text-lg font-medium">Available Balance</h2>
              <p className="text-white text-3xl font-bold mt-2">${balance.toFixed(2)}</p>
            </div>
            <div className="flex space-x-4">
              <button className="p-2 text-white hover:bg-blue-700 rounded-full">
                <FiBell className="h-6 w-6" />
              </button>
              <button className="p-2 text-white hover:bg-blue-700 rounded-full">
                <FiSettings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Bills Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Your Bills</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="h-5 w-5 mr-2" />
                New Bill
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading bills...</div>
            ) : bills.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No bills found</div>
            ) : (
              bills.map((bill) => (
                <div key={bill._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{bill.bill_name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Created by {bill.created_by_username} • {new Date(bill.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${bill.total_amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 capitalize">{bill.split_method} split</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create Bill Modal */}
      <CreateBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBillCreated={fetchBills}
      />
    </div>
  );
} 