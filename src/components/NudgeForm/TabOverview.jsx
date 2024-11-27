import React from 'react';
import PropTypes from 'prop-types';

function TabOverview({ formData, setFormData, onCancel, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Information</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Collection *
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.collection}
            onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
            required
          >
            <option value="">Select a collection</option>
            <option value="car-purchase-loan">Car Purchase Loan</option>
            <option value="personal-finance">Personal Finance Management</option>
            <option value="loans">Loans</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Business Value *
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.businessValue}
            onChange={(e) => setFormData({ ...formData, businessValue: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Priority *
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            required
          >
            <option value="">Select priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

TabOverview.propTypes = {
  formData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    collection: PropTypes.string.isRequired,
    businessValue: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default TabOverview;