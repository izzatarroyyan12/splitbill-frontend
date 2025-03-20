'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Bill } from '../types';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import toast from 'react-hot-toast';

interface BillListProps {
  token: string;
}

export default function BillList({ token }: BillListProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    billId: string;
    amount: number;
  }>({
    isOpen: false,
    billId: '',
    amount: 0
  });

  useEffect(() => {
    fetchBills();
  }, [token]);

  const fetchBills = async () => {
    try {
      const response = await apiService.getBills();
      setBills(response);
    } catch (error) {
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = (billId: string, amount: number) => {
    setPaymentModal({
      isOpen: true,
      billId,
      amount
    });
  };

  const handleMarkAsPaid = async (billId: string, participantIndex: number) => {
    try {
      await apiService.markParticipantAsPaid(billId, participantIndex);
      toast.success('Participant marked as paid successfully!');
      fetchBills();
    } catch (error) {
      toast.error('Failed to mark participant as paid');
    }
  };

  const handlePaymentSuccess = () => {
    fetchBills();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bills found. Create a new bill to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bills.map((bill) => {
        const isCreator = bill.created_by === token;
        const userParticipant = bill.participants.find(p => p.user_id === token);
        const amountDue = userParticipant?.amount_due || 0;
        const isPaid = userParticipant?.status === 'paid';

        return (
          <div
            key={bill._id}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow relative"
          >
            {/* Status Label */}
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {isCreator ? 'You' : `Assigned by ${bill.created_by}`}
              </span>
            </div>

            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{bill.bill_name}</h3>
                <p className="text-sm text-gray-500">
                  Created on {new Date(bill.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  Rp {bill.total_amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {bill.participants.filter(p => p.status === 'paid').length}/{bill.participants.length} paid
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Participants:</h4>
              <div className="space-y-2">
                {bill.participants.map((participant, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start text-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">
                          {participant.external_name}
                        </span>
                        {participant.user_id && (
                          <span className="text-green-500" title="Verified User">
                            ✔
                          </span>
                        )}
                      </div>
                      {/* Show items for per-product split */}
                      {bill.split_method === 'per_product' && participant.user_id && (
                        <div className="mt-1 ml-4 text-xs text-gray-500">
                          {bill.items
                            .filter(item => item.split?.some(s => s.user_id === participant.user_id))
                            .map(item => (
                              <div key={item.name}>
                                {item.name} × {item.split?.find(s => s.user_id === participant.user_id)?.quantity}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">
                        Rp {participant.amount_due.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            participant.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {participant.status}
                        </span>
                        {isCreator && !participant.user_id && participant.status === 'unpaid' && (
                          <button
                            onClick={() => handleMarkAsPaid(bill._id, index)}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Actions */}
            {!isPaid && !isCreator && amountDue > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handlePayBill(bill._id, amountDue)}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Pay Your Share
                </button>
              </div>
            )}
          </div>
        );
      })}

      <PaymentConfirmationModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, billId: '', amount: 0 })}
        onSuccess={handlePaymentSuccess}
        amount={paymentModal.amount}
        billId={paymentModal.billId}
      />
    </div>
  );
} 