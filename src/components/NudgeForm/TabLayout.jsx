import React from 'react';
import PropTypes from 'prop-types';

function TabLayout({ formData, setFormData }) {
  const handleImageUpload = (e) => {
    // TODO: Implement actual image upload
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        contentTemplate: {
          ...formData.contentTemplate,
          image: URL.createObjectURL(file) // Temporary preview URL
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Welcome Message
        </label>
        <textarea
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          rows={2}
          value={formData.contentTemplate.welcomeMessage}
          onChange={(e) => setFormData({
            ...formData,
            contentTemplate: {
              ...formData.contentTemplate,
              welcomeMessage: e.target.value
            }
          })}
          placeholder="Enter a welcome message for your nudge..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Call to Action Label
        </label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          value={formData.contentTemplate.callToActionLabel}
          onChange={(e) => setFormData({
            ...formData,
            contentTemplate: {
              ...formData.contentTemplate,
              callToActionLabel: e.target.value
            }
          })}
          placeholder="e.g., 'Learn More' or 'Get Started'"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Image
        </label>
        <div className="mt-1 flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
          />
          {formData.contentTemplate.image && (
            <img
              src={formData.contentTemplate.image}
              alt="Preview"
              className="h-20 w-20 object-cover rounded"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <div className="mt-1 flex items-center gap-4">
          <select
            className="block w-full rounded-md border border-gray-300 px-3 py-2"
            value={formData.status}
            onChange={(e) => setFormData({
              ...formData,
              status: e.target.value
            })}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <span className="text-sm text-gray-500">
            Version: {formData.version}
          </span>
        </div>
      </div>

      {formData.shortUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Short URL
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={formData.shortUrl}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(formData.shortUrl)}
              className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 rounded-md hover:bg-sky-100"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

TabLayout.propTypes = {
  formData: PropTypes.shape({
    status: PropTypes.string,
    version: PropTypes.string,
    shortUrl: PropTypes.string,
    contentTemplate: PropTypes.shape({
      welcomeMessage: PropTypes.string,
      callToActionLabel: PropTypes.string,
      image: PropTypes.string
    }).isRequired
  }).isRequired,
  setFormData: PropTypes.func.isRequired
};

export default TabLayout;