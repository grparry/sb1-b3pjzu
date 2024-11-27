import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function Cards() {
  const [showWithoutTags, setShowWithoutTags] = React.useState(false);
  const [filters, setFilters] = React.useState({
    tagType: '',
    publisher: '',
    personae: '',
    productCategory: '',
    engagementLevel: '',
    gender: '',
    search: ''
  });

  const cards = [
    {
      name: 'Prudential-Sing-Insurance-HEALTH_MALE-InApp',
      publisher: 'abaka',
      tags: ['LateCareer', 'Level2'],
      notificationTime: '14:29'
    }
  ];

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Cards' }
          ]}
        />

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <Link
              to="/cards/new"
              className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
            >
              <Plus size={20} />
              Create Card
            </Link>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600">
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600">
              Import
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showWithoutTags}
              onChange={(e) => setShowWithoutTags(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label className="text-sm text-gray-700">
              Show Notification Definitions without Tags
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Missing Tag Type
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={filters.tagType}
                onChange={(e) => setFilters({ ...filters, tagType: e.target.value })}
              >
                <option value="">Select Tag Type</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publisher
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={filters.publisher}
                onChange={(e) => setFilters({ ...filters, publisher: e.target.value })}
              >
                <option value="">Select Publisher</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personae
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={filters.personae}
                onChange={(e) => setFilters({ ...filters, personae: e.target.value })}
              >
                <option value="">Select Personae</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Category
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={filters.productCategory}
                onChange={(e) => setFilters({ ...filters, productCategory: e.target.value })}
              >
                <option value="">Select Product Category</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engagement Levels
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border-gray-300 rounded-md shadow-sm"
                  value={filters.engagementLevel}
                  onChange={(e) => setFilters({ ...filters, engagementLevel: e.target.value })}
                >
                  <option value="">Select Engagement Level</option>
                </select>
                <button className="px-4 py-2 text-sm text-sky-500 border border-sky-500 rounded-md hover:bg-sky-50">
                  Customize
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Search
            </label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <button className="px-6 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600">
            Search
          </button>
        </div>

        <div className="mt-6">
          <div className="text-sm text-gray-600 mb-4">
            Results found: {cards.length}
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Nudge Card Name</th>
                <th className="text-left py-3 font-medium">Publishers</th>
                <th className="text-left py-3 font-medium">Tags</th>
                <th className="text-left py-3 font-medium">Notification Time</th>
                <th className="text-left py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{card.name}</td>
                  <td className="py-3">{card.publisher}</td>
                  <td className="py-3">
                    {card.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-block bg-gray-200 rounded px-2 py-1 text-sm mr-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </td>
                  <td className="py-3">{card.notificationTime}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/cards/edit/${index}`}
                        className="text-sky-500 hover:text-sky-600"
                      >
                        Edit
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button className="text-red-500 hover:text-red-600">
                        Delete
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-gray-500 hover:text-gray-600">
                        Test
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Cards;