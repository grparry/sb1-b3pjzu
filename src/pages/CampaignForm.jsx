import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { Calendar } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function CampaignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    dateRange: {
      start: '',
      end: ''
    },
    selectedNudges: []
  });

  const nudges = [
    'Answer Questionnaire for linked accounts',
    'Answer Questionnaire for significant market event',
    'Auto-enrolment',
    'Automatic Savings',
    'Borrowing basics'
  ];

  useEffect(() => {
    if (id) {
      // Simulate fetching campaign data
      const mockData = {
        name: 'Campaign 16042021_1',
        description: 'Campaign 16042021_1',
        status: 'Active',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        },
        selectedNudges: ['Auto-enrolment', 'Automatic Savings']
      };
      setFormData(mockData);
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    navigate('/campaigns');
  };

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Campaigns', path: '/campaigns' },
            { label: id ? 'Edit Campaign' : 'New Campaign' }
          ]}
        />
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? formData.name : 'New Campaign'}
          </h1>
        </div>

        <Tab.Group>
          <Tab.List className="flex border-b">
            {['OVERVIEW', 'NUDGES', 'SCHEDULE'].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `px-6 py-3 text-sm font-medium outline-none ${
                    selected
                      ? 'text-sky-500 border-b-2 border-sky-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="p-6">
            <Tab.Panel>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </form>
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Select Nudges</h2>
                  <div className="border rounded-md p-4 space-y-2">
                    {nudges.map((nudge) => (
                      <label key={nudge} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.selectedNudges.includes(nudge)}
                          onChange={(e) => {
                            const newSelectedNudges = e.target.checked
                              ? [...formData.selectedNudges, nudge]
                              : formData.selectedNudges.filter(n => n !== nudge);
                            setFormData({ ...formData, selectedNudges: newSelectedNudges });
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{nudge}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sky-800">
                    <span className="font-medium">Selected Nudges:</span>
                    <span>{formData.selectedNudges.length}</span>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="date"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                        value={formData.dateRange.start}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, start: e.target.value }
                        })}
                      />
                      <Calendar className="absolute right-3 top-2.5 text-gray-400" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="date"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                        value={formData.dateRange.end}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, end: e.target.value }
                        })}
                      />
                      <Calendar className="absolute right-3 top-2.5 text-gray-400" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        <div className="p-6 border-t flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600"
          >
            Save Campaign
          </button>
        </div>
      </div>
    </>
  );
}

export default CampaignForm;