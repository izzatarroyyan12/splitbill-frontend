'use client';

import { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

interface Participant {
  external_name: string;
  amount_due: number;
  status: 'unpaid' | 'paid';
}

interface Item {
  name: string;
  price_per_unit: number;
  quantity: number;
  split?: Array<{
    external_name: string;
    quantity: number;
  }>;
}

export default function CreateBillModal({ isOpen, onClose, token }: CreateBillModalProps) {
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

  const validateForm = () => {
    // Validate bill name
    if (!billName.trim()) {
      toast.error('Please enter a bill name');
      return false;
    }

    // Validate participants
    if (participants.some(p => !p.external_name.trim())) {
      toast.error('Please enter names for all participants');
      return false;
    }

    // Validate items
    if (items.some(item => !item.name.trim() || item.price_per_unit <= 0 || item.quantity <= 0)) {
      toast.error('Please fill in all item details correctly');
      return false;
    }

    // Validate per-product splits
    if (splitMethod === 'per_product') {
      for (const item of items) {
        if (!item.split || item.split.length === 0) {
          toast.error('Please assign quantities for all participants in per-product split');
          return false;
        }

        const totalSplitQuantity = item.split.reduce((sum, split) => sum + split.quantity, 0);
        if (totalSplitQuantity !== item.quantity) {
          toast.error(`Total split quantity must equal item quantity for ${item.name}`);
          return false;
        }

        // Check if quantity is 1 and assigned to multiple participants
        if (item.quantity === 1 && item.split.length > 1) {
          toast.error(`Item "${item.name}" has quantity 1 and cannot be split between multiple participants`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const totalAmount = calculateTotal();
      
      // Calculate participant amounts based on split method
      let participantAmounts: Participant[] = [];
      
      if (splitMethod === 'equal') {
        // For equal split, divide total amount equally
        const amountPerPerson = totalAmount / participants.length;
        participantAmounts = participants.map(p => ({
          external_name: p.external_name,
          amount_due: amountPerPerson,
          status: 'unpaid'
        }));
      } else {
        // For per_product split, calculate based on item splits
        participantAmounts = participants.map(p => ({
          external_name: p.external_name,
          amount_due: 0,
          status: 'unpaid'
        }));

        // Calculate amount for each participant based on their item splits
        items.forEach(item => {
          const itemTotal = item.price_per_unit * item.quantity;
          if (item.split) {
            item.split.forEach(split => {
              const participant = participantAmounts.find(p => p.external_name === split.external_name);
              if (participant) {
                participant.amount_due += (itemTotal * (split.quantity / item.quantity));
              }
            });
          }
        });
      }

      const billData = {
        bill_name: billName,
        total_amount: totalAmount,
        split_method: splitMethod,
        created_by: token,
        participants: participantAmounts,
        items: items.map(item => ({
          ...item,
          split: splitMethod === 'per_product' ? item.split : undefined
        }))
      };

      await apiService.createBill(billData);
      toast.success('Bill created successfully!');
      onClose();
      // Reset form
      setBillName('');
      setParticipants([{ external_name: '', amount_due: 0, status: 'unpaid' }]);
      setItems([{ name: '', price_per_unit: 0, quantity: 1 }]);
    } catch (error) {
      toast.error('Failed to create bill');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Bill</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-2">
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
                    placeholder="Name"
                    required
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
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index] = { ...item, name: e.target.value };
                        setItems(newItems);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Item"
                      required
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
                      required
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
                        className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="1"
                        required
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
                  
                  {/* Item Split Section - Only show for per_product split method */}
                  {splitMethod === 'per_product' && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Split between participants:</span>
                        <span className="text-xs text-gray-500">
                          Total: {item.quantity} units
                        </span>
                      </div>
                      <div className="space-y-1">
                        {participants.map((participant, pIndex) => (
                          <div key={pIndex} className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600 w-20 truncate">
                              {participant.external_name}
                            </span>
                            <input
                              type="number"
                              value={item.split?.[pIndex]?.quantity || 0}
                              onChange={(e) => {
                                const newItems = [...items];
                                if (!newItems[index].split) {
                                  newItems[index].split = [];
                                }
                                newItems[index].split![pIndex] = {
                                  external_name: participant.external_name,
                                  quantity: Number(e.target.value)
                                };
                                setItems(newItems);
                              }}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              max={item.quantity}
                              placeholder="0"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                Rp {calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Bill
          </button>
        </form>
      </div>
    </div>
  );
} 