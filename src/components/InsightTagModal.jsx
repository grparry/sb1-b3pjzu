import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

function InsightTagModal({ isOpen, onClose, onConfirm }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [filters, setFilters] = useState({ area: '', category: '' });

  const insightTags = [
    { id: 'car-leasing', name: 'Car Leasing', area: 'Lifestyle', category: 'Car', description: 'Individual who has entered into a leasing agreement for a vehicle, paying monthly fees for..' },
    { id: 'car-loan', name: 'Car Loan', area: 'Lifestyle', category: 'Car', description: 'Individual who has borrowed money to finance the purchase of a vehicle, making monthly payments..' },
    { id: 'car-owner', name: 'Car Owner', area: 'Lifestyle', category: 'Car', description: 'Individual who owns a personal vehicle, facing expenses related to car ownership such as..' },
    { id: 'car-renter', name: 'Car Renter', area: 'Lifestyle', category: 'Car', description: 'Individual who regularly rents or leases vehicles instead of owning them outright, incurring rental or..' },
    { id: 'car-repairs', name: 'Car Repairs', area: 'Lifestyle', category: 'Car', description: 'Individual facing expenses for repairing or maintaining a personal vehicle, including costs for..' },
    { id: 'charitable', name: 'Charitable', area: 'Behavioral', category: '', description: 'Individual who regularly donates time, money, or resources to charitable causes or organizations..' },
    { id: 'parent', name: 'Parent', area: 'Lifestyle', category: 'Family', description: 'Individual responsible for the care and financial support of one or more children, making decisions..' },
    { id: 'compulsive-buyer', name: 'Compulsive Buyer', area: 'Financial', category: 'Financial Habits', description: 'Individual prone to impulsive or excessive spending, often leading to financial challenges or debt ..' },
    { id: 'eco-friendly', name: 'Eco-friendly Consumer', area: 'Lifestyle', category: 'Consumer Type', description: 'Individual committed to environmentally friendly practices and sustainability' },
    { id: 'economical', name: 'Economical Consumer', area: 'Lifestyle', category: 'Consumer Type', description: 'Individual focused on budget-friendly purchases' }
  ];

  const handleTagSelection = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleConfirm = () => {
    const selectedTagObjects = insightTags.filter(tag => selectedTags.includes(tag.id));
    onConfirm(selectedTagObjects);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Select Customer Insight Tags</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <select
              className="border rounded-md px-3 py-2"
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
            >
              <option value="">Area</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="behavioral">Behavioral</option>
              <option value="financial">Financial</option>
            </select>
            <select
              className="border rounded-md px-3 py-2"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Category</option>
              <option value="car">Car</option>
              <option value="family">Family</option>
              <option value="financial-habits">Financial Habits</option>
              <option value="consumer-type">Consumer Type</option>
            </select>
          </div>

          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 w-8"></th>
                <th className="text-left py-2">Insight</th>
                <th className="text-left py-2">Area</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {insightTags.map((tag) => (
                <tr key={tag.id} className="border-b">
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagSelection(tag.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td>{tag.name}</td>
                  <td>{tag.area}</td>
                  <td>{tag.category}</td>
                  <td className="text-sm text-gray-600">{tag.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select className="border rounded px-2 py-1">
                <option>10</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">1-5 of 13</span>
              <div className="flex gap-2">
                <button className="p-1 rounded hover:bg-gray-100">
                  <ChevronLeft size={20} />
                </button>
                <button className="p-1 rounded hover:bg-gray-100">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-md hover:bg-gray-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}

InsightTagModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default InsightTagModal;