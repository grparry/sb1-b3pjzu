import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import TabOverview from '../components/NudgeForm/TabOverview';
import TabTarget from '../components/NudgeForm/TabTarget';
import TabLayout from '../components/NudgeForm/TabLayout';
import TabComments from '../components/NudgeForm/TabComments';
import useNudgeForm from '../hooks/useNudgeForm';

function NudgeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formData, setFormData, handleSubmit, isLoading, error } = useNudgeForm(id, () => navigate('/nudges'));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle size={48} className="text-red-500" />
        <div className="text-lg text-gray-600">{error || 'Nudge not found'}</div>
        <button
          onClick={() => navigate('/nudges')}
          className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600"
        >
          Back to Nudges
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Nudges', path: '/nudges' },
            { label: id ? formData.title : 'New Nudge' }
          ]}
        />
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? formData.title : 'New Nudge'}
          </h1>
          <div className="text-sm text-gray-500 mt-1">{formData.version}</div>
        </div>

        <Tab.Group>
          <Tab.List className="flex border-b">
            {['OVERVIEW', 'TARGET', 'LAYOUT', 'COMMENTS'].map((tab) => (
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
              <TabOverview
                formData={formData}
                setFormData={setFormData}
                onCancel={() => navigate('/nudges')}
                onSubmit={handleSubmit}
              />
            </Tab.Panel>
            <Tab.Panel>
              <TabTarget
                formData={formData}
                setFormData={setFormData}
              />
            </Tab.Panel>
            <Tab.Panel>
              <TabLayout
                formData={formData}
                setFormData={setFormData}
              />
            </Tab.Panel>
            <Tab.Panel>
              <TabComments
                formData={formData}
                setFormData={setFormData}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
}

export default NudgeForm;