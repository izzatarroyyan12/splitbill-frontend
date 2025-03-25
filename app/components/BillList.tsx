'use client';

import React, { useEffect, useState } from 'react';
import { Bill } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import BillDetail from './BillDetail';
import { useRouter } from 'next/navigation';
import { FiClock, FiUser } from 'react-icons/fi';

interface BillListProps {
  refreshTrigger: number;
  onBillClick: (bill: Bill) => void;
}

export default function BillList({ refreshTrigger, onBillClick }: BillListProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    fetchBills();
  }, [refreshTrigger]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token || !user) {
        router.push('/login');
        return;
      }

      const response = await apiService.getBills();
      setBills(response);
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch bills';
      setError(errorMessage);
      
      if (error.response?.status === 401 || !localStorage.getItem('token')) {
        toast.error('Please log in to view bills');
        router.push('/login');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No bills found. Create your first bill to get started!
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-200">
        {bills.map((bill) => (
          <div
            key={bill._id}
            onClick={() => onBillClick(bill)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex flex-col">
              {user && bill.participants.some(p => 
                (p.user_id === user._id || p.external_name === user.username) && 
                p.status === 'unpaid'
              ) && (
                <div className="self-end bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                  Unpaid
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{bill.bill_name}</h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <FiUser className="h-4 w-4 mr-1" />
                      <span>{bill.created_by_username}</span>
                    </div>
                    <div className="flex items-center">
                      <FiClock className="h-4 w-4 mr-1" />
                      <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(bill.total_amount)}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{bill.split_method} split</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 