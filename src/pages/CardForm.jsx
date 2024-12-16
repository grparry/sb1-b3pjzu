import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

function CardForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    publisher: 'abaka',
    notificationTime: '14:29',
    personaeTags: [],
    engagementLevelsTags: [],
    productCategoriesTags: [],
    genderTags: []
  });

  useEffect(() => {
    if (id) {
      // Simulate fetching card data
      const mockData = {
        name: 'Prudential-Sing-Insurance-HEALTH_MALE-InApp',
        publisher: 'abaka',
        notificationTime: '14:29',
        personaeTags: ['LateCareer'],
        engagementLevelsTags: ['Level2'],
        productCategoriesTags: [],
        genderTags: []
      };
      setFormData(mockData);
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    navigate('/cards');
  };

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Cards', path: '/cards' },
            { label: id ? 'Edit Card' : 'New Card' }
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold">
            {id ? 'Edit Notification Definition' : 'New Notification Definition'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nudge Card Name
            </label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publishers
            </label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm"
              value={formData.publisher}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Time
            </label>
            <input
              type="time"
              className="w-full border-gray-300 rounded-md shadow-sm"
              value={formData.notificationTime}
              onChange={(e) => setFormData({ ...formData, notificationTime: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personae Tags
            </label>
            <select
              multiple
              className="w-full border-gray-300 rounded-md shadow-sm h-32"
              value={formData.personaeTags}
              onChange={(e) => setFormData({
                ...formData,
                personaeTags: Array.from(e.target.selectedOptions, option => option.value)
              })}
            >
              <option value="EstablishCareer">EstablishCareer</option>
              <option value="LateCareer">LateCareer</option>
              <option value="Mid-Career">Mid-Career</option>
              <option value="Mid-Career(LowerIncome)">Mid-Career(LowerIncome)</option>
              <option value="NewWorker">NewWorker</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engagement Levels Tags
            </label>
            <select
              multiple
              className="w-full border-gray-300 rounded-md shadow-sm h-32"
              value={formData.engagementLevelsTags}
              onChange={(e) => setFormData({
                ...formData,
                engagementLevelsTags: Array.from(e.target.selectedOptions, option => option.value)
              })}
            >
              <option value="Level1">Level1</option>
              <option value="Level2">Level2</option>
              <option value="Level3">Level3</option>
            </select>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/cards')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CardForm;