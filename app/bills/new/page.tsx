'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Participant {
  user_id?: string;
  external_name?: string;
  amount_due: number;
  status: 'unpaid' | 'paid';
}

interface Item {
  name: string;
  price_per_unit: number;
  quantity: number;
  split?: Array<{
    user_id?: string;
    external_name?: string;
    quantity: number;
  }>;
}

export default function NewBillPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billName, setBillName] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'per_product'>('equal');
  const [participants, setParticipants] = useState<Participant[]>([
    { external_name: '', amount_due: 0, status: 'unpaid' }
  ]);
  const [items, setItems] = useState<Item[]>([
    { name: '', price_per_unit: 0, quantity: 1 }
  ]);

  const addParticipant = () => {
    setParticipants([...participants, { external_name: '', amount_due: 0, status: 'unpaid' }]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { name: '', price_per_unit: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = calculateTotal();
      const billData = {
        bill_name: billName,
        total_amount: totalAmount,
        split_method: splitMethod,
        created_by: user?._id || '',
        participants: participants.map(p => ({
          ...p,
          amount_due: splitMethod === 'equal' ? totalAmount / participants.length : p.amount_due
        })),
        items
      };

      await apiService.createBill(billData);
      toast.success('Bill created successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Bill</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bill Name */}
            <div>
              <label htmlFor="billName" className="block text-sm font-medium text-gray-700 mb-1">
                Bill Name
              </label>
              <input
                type="text"
                id="billName"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Split Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Split Method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="equal"
                    checked={splitMethod === 'equal'}
                    onChange={(e) => setSplitMethod(e.target.value as 'equal' | 'per_product')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Equal Split</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="per_product"
                    checked={splitMethod === 'per_product'}
                    onChange={(e) => setSplitMethod(e.target.value as 'equal' | 'per_product')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Per Product</span>
                </label>
              </div>
            </div>

            {/* Participants */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Participants
                </label>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  + Add Participant
                </button>
              </div>
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={participant.external_name}
                      onChange={(e) => {
                        const newParticipants = [...participants];
                        newParticipants[index] = {
                          ...participant,
                          external_name: e.target.value
                        };
                        setParticipants(newParticipants);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Participant name"
                    />
                    {participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="text-red-600 hover:text-red-500"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Items
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  + Add Item
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index] = { ...item, name: e.target.value };
                        setItems(newItems);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      value={item.price_per_unit}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index] = { ...item, price_per_unit: Number(e.target.value) };
                        setItems(newItems);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Price"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...item, quantity: Number(e.target.value) };
                          setItems(newItems);
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="1"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-500"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">
                  Rp {calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 