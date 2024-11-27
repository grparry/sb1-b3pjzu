import React from 'react';
import PropTypes from 'prop-types';

function TabLayout({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Notification Content</h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image *
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              >
                <option value="">Select image</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notification Title *
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.notificationTitle}
                onChange={(e) => setFormData({ ...formData, notificationTitle: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notification Body *
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={4}
                value={formData.notificationBody}
                onChange={(e) => setFormData({ ...formData, notificationBody: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

TabLayout.propTypes = {
  formData: PropTypes.shape({
    image: PropTypes.string.isRequired,
    notificationTitle: PropTypes.string.isRequired,
    notificationBody: PropTypes.string.isRequired
  }).isRequired,
  setFormData: PropTypes.func.isRequired
};

export default TabLayout;