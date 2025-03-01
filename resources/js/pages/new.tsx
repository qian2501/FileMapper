import axios from 'axios';
import { useState } from 'react';
import { Head } from '@inertiajs/react';

export default function New() {
  const [formData, setFormData] = useState({
    source_dir: '',
    target_dir: '',
    include_pattern: '',
    exclude_pattern: '',
    target_template: '',
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAction = async (endpoint: string) => {
    setFormErrors({});
    
    let payload: Record<string, any> = {
      source_dir: formData.source_dir,
      include_pattern: formData.include_pattern,
      exclude_pattern: formData.exclude_pattern || null,
    };

    if (endpoint !== 'scan') {
      payload = {
        ...payload,
        target_dir: formData.target_dir,
        target_template: formData.target_template,
      };
    }

    try {
      const response = await axios.post(`/${endpoint}`, payload, {
        withCredentials: true,
      });
      setEntries(response.data.entries);
    } catch (error: any) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
      console.error('Operation failed:', error);
    }
  };

  return (
    <div className='w-4/5 m-auto py-6'>
      <Head title="New Rule" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <form className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Source Directory</label>
              <input
                type="text"
                name="source_dir"
                value={formData.source_dir}
                onChange={handleInputChange}
                className="w-full rounded border p-2"
                required
              />
              {formErrors.source_dir && (
                <p className="text-red-500 text-sm">{formErrors.source_dir[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Target Directory</label>
              <input
                type="text"
                name="target_dir"
                value={formData.target_dir}
                onChange={handleInputChange}
                className="w-full rounded border p-2"
              />
              {formErrors.target_dir && (
                <p className="text-red-500 text-sm">{formErrors.target_dir[0]}</p>
              )}
            </div>

            <div className="space-y-2 col-span-full">
              <label className="block text-sm font-medium">Include Pattern (RegEx)</label>
              <input
                type="text"
                name="include_pattern"
                value={formData.include_pattern}
                onChange={handleInputChange}
                className="w-full rounded border p-2"
                required
              />
              {formErrors.include_pattern && (
                <p className="text-red-500 text-sm">{formErrors.include_pattern[0]}</p>
              )}
            </div>

            <div className="space-y-2 col-span-full">
              <label className="block text-sm font-medium">Exclude Pattern (RegEx)</label>
              <input
                type="text"
                name="exclude_pattern"
                value={formData.exclude_pattern}
                onChange={handleInputChange}
                className="w-full rounded border p-2"
              />
              {formErrors.exclude_pattern && (
                <p className="text-red-500 text-sm">{formErrors.exclude_pattern[0]}</p>
              )}
            </div>

            <div className="space-y-2 col-span-full">
              <label className="block text-sm font-medium">Target Template</label>
              <input
                type="text"
                name="target_template"
                value={formData.target_template}
                onChange={handleInputChange}
                className="w-full rounded border p-2"
              />
              {formErrors.target_template && (
                <p className="text-red-500 text-sm">{formErrors.target_template[0]}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={() => handleAction('scan')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Scan
            </button>
            <button
              type="button"
              onClick={() => handleAction('preview')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => handleAction('apply')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Apply
            </button>
          </div>
        </form>

        {entries.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-gray-300">
              <thead>
                <tr className="bg-gray-300">
                  <th className="border p-2 text-black text-left">Source Name</th>
                  {entries[0]?.target && <th className="border p-2 text-black text-left">Target Name</th>}
                  {entries[0]?.processed !== undefined && <th className="border p-2 text-black text-left">Processed</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-800">
                    <td className="border p-2 font-mono text-sm">{entry.source}</td>
                    {entry.target && <td className="border p-2 font-mono text-sm">{entry.target}</td>}
                    {entry.processed !== undefined && (
                      <td className="border p-2 text-center">
                        {entry.processed ? '● ' : '○'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}