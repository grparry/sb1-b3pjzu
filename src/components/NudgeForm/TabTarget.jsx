import React from 'react';
import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react';
import BasicSegmentation from './targeting/BasicSegmentation';
import InsightTagSelector from '../InsightTagSelector';

function TabTarget({ formData, setFormData }) {
  return (
    <Tab.Group>
      <Tab.List className="flex border-b mb-6">
        {['BASIC', 'ADVANCED'].map((tab) => (
          <Tab
            key={tab}
            className={({ selected }) =>
              `px-6 py-2 text-sm font-medium outline-none ${
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

      <Tab.Panels>
        <Tab.Panel>
          <BasicSegmentation formData={formData} setFormData={setFormData} />
        </Tab.Panel>
        <Tab.Panel>
          <InsightTagSelector formData={formData} setFormData={setFormData} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}

TabTarget.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default TabTarget;