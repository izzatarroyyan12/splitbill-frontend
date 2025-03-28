'use client';

import { useState, useEffect } from 'react';
import { Bill } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import { FiX, FiCheck, FiClock, FiUser, FiDollarSign } from 'react-icons/fi';
import { FcApproval } from "react-icons/fc";

interface BillDetailProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BillDetail({ bill, isOpen, onClose, onUpdate }: BillDetailProps) {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill>(bill);

  useEffect(() => {
    setCurrentBill(bill);
  }, [bill]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleMarkAsPaid = async (participantIndex: number) => {
    try {
      await apiService.markParticipantAsPaid({
        billId: currentBill._id,
        participantIndex
      });
      toast.success('Participant marked as paid');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark participant as paid');
    }
  };

  const handlePayBill = async (password: string) => {
    try {
      await apiService.payBill({
        billId: currentBill._id,
        password
      });
      toast.success('Bill paid successfully');
      setShowPaymentModal(false);
      
      const updatedBill = {
        ...currentBill,
        participants: currentBill.participants.map((p, index) => {
          if (p.user_id === user?._id || p.external_name === user?.username) {
            return { ...p, status: 'paid' as const };
          }
          return p;
        })
      };
      setCurrentBill(updatedBill);
      
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to pay bill');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pt-2">
          <h2 className="text-2xl font-bold text-gray-900">{currentBill.bill_name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Bill Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-gray-600">
              <FiUser className="h-5 w-5 mr-2" />
              <span>Created by {currentBill.created_by_username}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FiClock className="h-5 w-5 mr-2" />
              <span>{new Date(currentBill.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FiDollarSign className="h-5 w-5 mr-2" />
              <span>Total: {formatCurrency(currentBill.total_amount)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="capitalize">{currentBill.split_method} split</span>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
            <div className="space-y-4">
              {currentBill.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {formatCurrency(Number(item.price_per_unit))}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(Number(item.price_per_unit) * Number(item.quantity))}
                    </p>
                  </div>
                  {currentBill.split_method === 'per_product' && item.split && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium mb-1">Split:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {item.split.map((split, splitIndex) => (
                          <div key={splitIndex} className="flex justify-between">
                            <span>{split.external_name}</span>
                            <span>{split.quantity} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Participants</h3>
            <div className="space-y-3">
              {currentBill.participants.map((participant, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center bg-gray-50 rounded-lg p-4 ${
                    participant.user_id === user?._id ? 'border-2 border-blue-500' : ''
                  }`}
                >
                  <div>
                    <p className={`font-medium flex items-center ${
                      participant.user_id === user?._id ? 'text-blue-600 font-bold' : 'text-gray-900'
                    }`}>
                      {participant.external_name}
                      {participant.user_id && (
                        <span className="ml-2 text-blue-500" title="Verified Livin User">
                          <FcApproval className="h-4 w-4" />
                        </span>
                      )}
                    </p>
                    <p className={`text-sm ${
                      participant.user_id === user?._id ? 'text-blue-600 font-semibold' : 'text-gray-500'
                    }`}>
                      {formatCurrency(participant.amount_due)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {participant.status === 'paid' ? (
                      <span className="flex items-center text-green-600">
                        <FiCheck className="h-5 w-5 mr-1" />
                        Paid
                      </span>
                    ) : participant.user_id === user?._id ? (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Pay Now
                      </button>
                    ) : currentBill.created_by === user?._id && !participant.user_id ? (
                      <button
                        onClick={() => handleMarkAsPaid(index)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Mark as Paid
                      </button>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentConfirmationModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePayBill}
          amount={currentBill.participants.find(p => 
            p.user_id === user?._id || p.external_name === user?.username
          )?.amount_due || 0}
        />
      )}
    </div>
  );
} 