'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Participant, Item, CreateBillRequest } from '../types';
import toast from 'react-hot-toast';

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated: () => void;
}

export default function CreateBillModal({
  isOpen,
  onClose,
  onBillCreated
}: CreateBillModalProps) {
  const { user } = useAuth();
  const [billName, setBillName] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'per_product'>('equal');
  const [includeMe, setIncludeMe] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [items, setItems] = useState<Item[]>([
    { name: '', price_per_unit: 0, quantity: 1 }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setBillName('');
      setIncludeMe(true);
      setSplitMethod('equal');
      setItems([{ name: '', price_per_unit: 0, quantity: 1 }]);
      
      // Initialize participants based on includeMe state
      if (user) {
        setParticipants(includeMe ? [
          {
            user_id: user._id,
            username: user.username,
            external_name: user.username,
            amount_due: 0,
            status: 'paid'
          }
        ] : []);
      }
    }
  }, [isOpen, user]);

  // Update participants when includeMe changes
  useEffect(() => {
    if (user) {
      if (includeMe) {
        // Add current user if not already in the list
        const currentUserExists = participants.some(p => p.user_id === user._id);
        if (!currentUserExists) {
          setParticipants([
            {
              user_id: user._id,
              username: user.username,
              external_name: user.username,
              amount_due: 0,
              status: 'paid'
            },
            ...participants
          ]);
        }
      } else {
        // Remove current user from participants
        setParticipants(participants.filter(p => p.user_id !== user._id));
      }
    }
  }, [includeMe, user]);

  const addParticipant = () => {
    setParticipants([
      ...participants,
      {
        external_name: '',
        amount_due: 0,
        status: 'pending' as const
      }
    ]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      const participantToRemove = participants[index];
      // Don't allow removing the current user if includeMe is true
      if (includeMe && participantToRemove.user_id === user?._id) {
        toast.error("You can't remove yourself while 'Include me' is checked");
        return;
      }
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
      external_name: value
    };
    setParticipants(newParticipants);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        name: '',
        price_per_unit: 0,
        quantity: 1,
        split: participants.map(p => ({
          external_name: p.external_name,
          quantity: Math.floor(1 / participants.length)
        }))
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    if (field === 'price_per_unit' || field === 'quantity') {
      value = Math.max(0, Number(value));
    }
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const updateItemSplit = (itemIndex: number, participantIndex: number, quantity: number) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    
    if (!item.split) {
      item.split = participants.map(p => ({
        external_name: p.external_name,
        quantity: Math.floor(item.quantity / participants.length)
      }));
    }
    
    // Ensure quantity doesn't exceed item's total quantity
    const newQuantity = Math.min(Math.max(0, quantity), item.quantity);
    if (item.split) {
      item.split[participantIndex].quantity = newQuantity;
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);
  };

  const calculateEqualSplit = (totalAmount: number, numberOfParticipants: number) => {
    const amountPerPerson = totalAmount / numberOfParticipants;
    return Array(numberOfParticipants).fill(amountPerPerson);
  };

  const calculatePerProductSplit = (items: Item[], participants: Participant[]) => {
    const participantAmounts = new Array(participants.length).fill(0);
    
    items.forEach(item => {
      const itemTotal = item.price_per_unit * item.quantity;
      
      if (item.split) {
        const totalSplitQuantity = item.split.reduce((sum, split) => sum + split.quantity, 0);
        if (totalSplitQuantity > 0) {
          item.split.forEach((split, index) => {
            const splitRatio = split.quantity / totalSplitQuantity;
            participantAmounts[index] += itemTotal * splitRatio;
          });
        } else {
          // If no split quantities, divide equally
          const equalAmount = itemTotal / participants.length;
          participants.forEach((_, index) => {
            participantAmounts[index] += equalAmount;
          });
        }
      } else {
        // If no split defined, divide equally
        const equalAmount = itemTotal / participants.length;
        participants.forEach((_, index) => {
          participantAmounts[index] += equalAmount;
        });
      }
    });
    
    return participantAmounts;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create a bill');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate total amount
      const totalAmount = calculateTotal();

      // Calculate participant amounts based on split method
      const participantAmounts = splitMethod === 'equal'
        ? calculateEqualSplit(totalAmount, participants.length)
        : calculatePerProductSplit(items, participants);

      // Update participants with calculated amounts
      const updatedParticipants = participants.map((participant, index) => ({
        ...participant,
        amount_due: Math.round(participantAmounts[index] * 100) / 100, // Round to 2 decimal places
        status: participant.user_id === user._id ? 'paid' as const : 'pending' as const
      }));

      const billData: CreateBillRequest = {
        bill_name: billName.trim(),
        split_method: splitMethod,
        participants: updatedParticipants.map(({ status, ...participant }) => ({
          ...participant,
          external_name: participant.external_name || ''
        })),
        items: items.map(item => ({
          name: item.name.trim(),
          price_per_unit: Number(item.price_per_unit),
          quantity: Number(item.quantity),
          split: splitMethod === 'per_product' ? item.split?.map(split => ({
            external_name: split.external_name || '',
            quantity: Number(split.quantity)
          })) : undefined
        }))
      };

      await apiService.createBill(billData);
      toast.success('Bill created successfully!');
      onClose();
      onBillCreated();
    } catch (error: any) {
      console.error('Error creating bill:', error);
      toast.error(error.message || 'Failed to create bill');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Bill</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="billName" className="block text-sm font-medium text-gray-700 mb-1">
              Bill Name
            </label>
            <input
              type="text"
              id="billName"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter bill name"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeMe"
              checked={includeMe}
              onChange={(e) => setIncludeMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeMe" className="text-sm font-medium text-gray-700">
              Include me in this bill
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Method
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={splitMethod === 'equal'}
                  onChange={(e) => setSplitMethod(e.target.value as 'equal' | 'per_product')}
                  className="mr-2"
                />
                Equal Split
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="per_product"
                  checked={splitMethod === 'per_product'}
                  onChange={(e) => setSplitMethod(e.target.value as 'equal' | 'per_product')}
                  className="mr-2"
                />
                Per Product Split
              </label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Participants
              </label>
              <button
                type="button"
                onClick={addParticipant}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Add Participant
              </button>
            </div>
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={participant.external_name}
                    onChange={(e) => updateParticipant(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter username or name"
                    required
                    disabled={participant.user_id === user?._id}
                  />
                  {participant.user_id !== user?._id && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-sm text-gray-500 italic">No participants added yet. Add at least one participant.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Add Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, itemIndex) => (
                <div key={itemIndex} className="border rounded-md p-4">
                  {/* Item Name - First Line */}
                  <div className="mb-3">
                    <label className="text-xs text-gray-600 mb-1 block">Item name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(itemIndex, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item name"
                      required
                    />
                  </div>

                  {/* Price, Quantity, Remove - Second Line */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">Price per unit</label>
                      <input
                        type="number"
                        value={item.price_per_unit}
                        onChange={(e) => updateItem(itemIndex, 'price_per_unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Price"
                        min="0"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(itemIndex, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Quantity"
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(itemIndex)}
                      className="text-red-600 hover:text-red-700 px-3 py-2 h-[42px] flex items-center"
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>
                  </div>

                  {splitMethod === 'per_product' && participants.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {participants.map((participant, participantIndex) => (
                        <div key={participantIndex} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{participant.external_name || ''}</span>
                          <input
                            type="number"
                            value={item.split?.[participantIndex]?.quantity || 0}
                            onChange={(e) => updateItemSplit(itemIndex, participantIndex, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max={item.quantity}
                            required={splitMethod === 'per_product'}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">
              Total: {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(calculateTotal())}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !billName.trim() || participants.length === 0 || items.some(item => !item.name.trim() || item.price_per_unit <= 0 || item.quantity <= 0)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Bill'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 