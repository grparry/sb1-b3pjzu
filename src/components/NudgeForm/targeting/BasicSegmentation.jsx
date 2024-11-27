import React from 'react';
import PropTypes from 'prop-types';

function BasicSegmentation({ formData, setFormData }) {
  const handleAgeRangeChange = (key, value) => {
    setFormData({
      ...formData,
      ageRange: { ...formData.ageRange, [key]: parseInt(value) }
    });
  };

  const handleIncomeChange = (key, value) => {
    setFormData({
      ...formData,
      income: { ...formData.income, [key]: parseInt(value) }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Minimum Age
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.ageRange.min}
            onChange={(e) => handleAgeRangeChange('min', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Maximum Age
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.ageRange.max}
            onChange={(e) => handleAgeRangeChange('max', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Minimum Annual Income
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.income.min}
            onChange={(e) => handleIncomeChange('min', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Maximum Annual Income
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.income.max}
            onChange={(e) => handleIncomeChange('max', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        >
          <option value="-1">All</option>
          <option value="0">None</option>
          <option value="1">Male</option>
          <option value="2">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Days since last notification
        </label>
        <input
          type="number"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          value={formData.lastNotification.days}
          onChange={(e) => setFormData({
            ...formData,
            lastNotification: { ...formData.lastNotification, days: e.target.value }
          })}
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.registration.registeredOnly}
            onChange={(e) => setFormData({
              ...formData,
              registration: { ...formData.registration, registeredOnly: e.target.checked }
            })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Registered users only</span>
        </label>
      </div>
    </div>
  );
}

BasicSegmentation.propTypes = {
  formData: PropTypes.shape({
    ageRange: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number
    }).isRequired,
    income: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number
    }).isRequired,
    gender: PropTypes.string.isRequired,
    lastNotification: PropTypes.shape({
      days: PropTypes.string
    }).isRequired,
    registration: PropTypes.shape({
      registeredOnly: PropTypes.bool
    }).isRequired
  }).isRequired,
  setFormData: PropTypes.func.isRequired
};

export default BasicSegmentation;