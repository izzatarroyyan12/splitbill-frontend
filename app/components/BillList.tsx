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
      {bills.map((bill) => (
        <div key={bill._id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{bill.bill_name}</h3>
              <p className="text-sm text-gray-500">
                Created by {bill.created_by === token ? 'you' : bill.created_by}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                Rp {bill.total_amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {bill.split_method === 'equal' ? 'Equal Split' : 'Per Product Split'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
              <div className="space-y-2">
                {bill.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="text-gray-900">
                      Rp {(item.price_per_unit * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Participants */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Participants</h4>
              <div className="space-y-2">
                {bill.participants.map((participant, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {participant.external_name}
                      </span>
                      {participant.status === 'paid' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        Rp {participant.amount_due.toLocaleString()}
                      </span>
                      {participant.status === 'unpaid' && (
                        bill.created_by === token ? (
                          <button
                            onClick={() => handleMarkAsPaid(bill._id, index)}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePayBill(bill._id, participant.amount_due)}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Pay
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

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