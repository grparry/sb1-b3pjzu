import React from 'react';
import PropTypes from 'prop-types';

function TabComments({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Comment *
        </label>
        <textarea
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          rows={4}
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
        />
      </div>
    </div>
  );
}

TabComments.propTypes = {
  formData: PropTypes.shape({
    comment: PropTypes.string.isRequired
  }).isRequired,
  setFormData: PropTypes.func.isRequired
};

export default TabComments;