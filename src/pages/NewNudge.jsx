import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import Breadcrumb from '../components/Breadcrumb';
import TabOverview from '../components/NBAForm/TabOverview';
import TabTarget from '../components/NBAForm/TabTarget';
import TabLayout from '../components/NBAForm/TabLayout';
import TabComments from '../components/NBAForm/TabComments';
import useNudgeForm from '../hooks/useNudgeForm';

function NewNudge() {
  const navigate = useNavigate();
  const { formData, setFormData, handleSubmit } = useNudgeForm(null, () => navigate('/nudges'));

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
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
            { label: 'New Nudge' }
          ]}
        />
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold text-gray-900">
            {formData.title || 'New Nudge'}
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

export default NewNudge;