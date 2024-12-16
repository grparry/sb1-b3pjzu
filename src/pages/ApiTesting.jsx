import React, { useState, useCallback } from 'react';
import { Upload, Trash2, Plus, Eye, Database } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { getAllDefinitions, addDefinition, deleteDefinition } from '../services/apiStorage';
import ApiSpecViewer from '../components/ApiSpecViewer';

function ApiTesting() {
  const [apiDefinitions, setApiDefinitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [isSpecViewerOpen, setIsSpecViewerOpen] = useState(false);

  // Load API definitions on component mount
  React.useEffect(() => {
    const loadApiDefinitions = async () => {
      try {
        const definitions = await getAllDefinitions();
        setApiDefinitions(definitions || []);
      } catch (error) {
        console.error('Error loading API definitions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiDefinitions();
  }, []);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target.result);
          console.log('Parsed API Spec:', content);
          
          const newDefinition = {
            id: crypto.randomUUID(),
            name: file.name,
            content,
            uploadedAt: new Date().toISOString()
          };

          console.log('New API Definition:', newDefinition);
          await addDefinition(newDefinition);
          setApiDefinitions(prev => [...prev, newDefinition]);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          // TODO: Add error notification
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
      // TODO: Add error notification
    }
  }, []);

  const handleDeleteDefinition = async (id) => {
    try {
      await deleteDefinition(id);
      setApiDefinitions(prev => prev.filter(def => def.id !== id));
    } catch (error) {
      console.error('Error deleting API definition:', error);
      // TODO: Add error notification
    }
  };

  const handleViewSpec = (definition) => {
    setSelectedSpec(definition);
    setIsSpecViewerOpen(true);
  };

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'API Testing' }
          ]}
        />

        <div className="mt-4">
          <label className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 cursor-pointer">
            <Plus size={20} />
            Upload API Definition
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-4 px-6 font-medium">Name</th>
                <th className="text-left py-4 px-6 font-medium">Uploaded</th>
                <th className="text-right py-4 px-6 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiDefinitions.map((definition) => (
                <tr key={definition.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-4 px-6">{definition.name}</td>
                  <td className="py-4 px-6">
                    {new Date(definition.uploadedAt).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleViewSpec(definition)}
                      className="p-2 text-gray-500 hover:text-sky-500"
                      title="View API Endpoints"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteDefinition(definition.id)}
                      className="p-2 text-gray-500 hover:text-red-500"
                      title="Delete Definition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {apiDefinitions.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-gray-500">
                    No API definitions uploaded yet. Click "Upload API Definition" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isSpecViewerOpen && (
        <ApiSpecViewer
          isOpen={isSpecViewerOpen}
          onClose={() => setIsSpecViewerOpen(false)}
          apiSpec={selectedSpec}
        />
      )}
    </>
  );
}

export default ApiTesting;
