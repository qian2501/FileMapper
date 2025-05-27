import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Button';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';

export default function RuleForm({ 
  initialData = {},
  isOnetime = false
}) {
  const [formData, setFormData] = useState({
    source_dir: initialData.source_dir || '',
    target_dir: initialData.target_dir || '',
    include_pattern: initialData.include_pattern || '',
    exclude_pattern: initialData.exclude_pattern || '',
    target_template: initialData.target_template || '',
  });

  const [entries, setEntries] = useState(initialData?.mappings || []);
  const [formErrors, setFormErrors] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isOnetimeKeepOriginal, setIsOnetimeKeepOriginal] = useState(true);

  useEffect(() => {
    if (initialData?.mappings) {
      setEntries(initialData.mappings.map(mapping => ({
        source: mapping.source_name,
        target: mapping.target_name,
        processed: mapping.processed
      })));
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAction = async (endpoint) => {
    switch (endpoint) {
      case 'scan':
        setIsScanning(true);
        break;
      case 'preview':
        setIsPreviewing(true);
        break;
      case 'apply':
      case 'apply-once':
        setIsApplying(true);
        break;
    }
    setFormErrors({});

    const payload = {
      ...formData,
      ...(initialData?.id && { rule_id: initialData.id }),
      ...(isOnetime && { keep_original: isOnetimeKeepOriginal })
    };

    try {
      const response = await axios.post(`/${endpoint}`, payload, {
        withCredentials: true,
      });

      if (endpoint === 'apply' || endpoint === 'apply-once') {
        router.visit('/');
      } else {
        setEntries(response.data.entries);
      }
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
      console.error('Operation failed:', error);
    } finally {
      switch (endpoint) {
        case 'scan':
          setIsScanning(false);
          break;
        case 'preview':
          setIsPreviewing(false);
          break;
        case 'apply':
        case 'apply-once':
          setIsApplying(false);
          break;
      }
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={initialData?.id ? "Edit Rule" : isOnetime ? "Onetime Edit" : "Create Rule"} />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {initialData?.id ? 'Edit Rule' : isOnetime ? 'Onetime Edit' : 'Create New Rule'}
          </h1>

          <Link href="/">
            <Button>{"< Back"}</Button>
          </Link>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <InputLabel forInput="source_dir" value="Source Directory" />
            <TextInput
              name="source_dir"
              value={formData.source_dir}
              handleChange={handleInputChange}
              className="mt-1 block w-full text-black"
              placeholder="/path/to/source"
            />
            {formErrors.source_dir && (
              <InputError message={formErrors.source_dir[0]} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="target_dir" value="Target Directory" />
            <TextInput
              name="target_dir"
              value={formData.target_dir}
              handleChange={handleInputChange}
              className="mt-1 block w-full text-black"
              placeholder="/path/to/target"
            />
            {formErrors.target_dir && (
              <InputError message={formErrors.target_dir[0]} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="include_pattern" value="Include Pattern (RegEx)" />
            <TextInput
              name="include_pattern"
              value={formData.include_pattern}
              handleChange={handleInputChange}
              className="mt-1 block w-full text-black"
              placeholder="/(.*)/"
            />
            {formErrors.include_pattern && (
              <InputError message={formErrors.include_pattern[0]} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="exclude_pattern" value="Exclude Pattern (RegEx)" />
            <TextInput
              name="exclude_pattern"
              value={formData.exclude_pattern}
              handleChange={handleInputChange}
              className="mt-1 block w-full text-black"
              placeholder="(A|B)"
            />
            {formErrors.exclude_pattern && (
              <InputError message={formErrors.exclude_pattern[0]} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="target_template" value="Target Template" />
            <TextInput
              name="target_template"
              value={formData.target_template}
              handleChange={handleInputChange}
              className="mt-1 block w-full text-black"
              placeholder="New ($1) File Name.$2"
            />
            <div>
              <div className="ml-2 text-sm text-gray-400">Use $n for the n'th matched string.</div>
              <div className="ml-2 text-sm text-gray-400">Use $n+x to offset matched numbers.</div>
            </div>
            {formErrors.target_template && (
              <InputError message={formErrors.target_template[0]} className="mt-2" />
            )}
          </div>

          <div className="flex justify-between gap-4">
            <div>
              {isOnetime && (
                <div>
                  <Checkbox
                    name="keep_original"
                    checked={isOnetimeKeepOriginal}
                    onChange={(e) => setIsOnetimeKeepOriginal(e.target.checked)}
                    label="Keep original files"
                  />

                  <span className="ml-2 text-sm">Keep original files</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                onClick={() => handleAction('scan')}
                disabled={isScanning}
              >
                {isScanning ? 'Scanning...' : 'Scan'}
              </Button>

              <Button
                onClick={() => handleAction('preview')}
                disabled={isPreviewing}
              >
                {isPreviewing ? 'Previewing...' : 'Preview'}
              </Button>

              <Button
                onClick={() => handleAction(isOnetime ? 'apply-once' : 'apply')}
                disabled={isApplying}
                variant='primary'
              >
                {isApplying ? 'Processing...' : isOnetime ? 'Execute Once' : initialData?.id ? 'Update Rule' : 'Apply'}
              </Button>
            </div>
          </div>
        </form>

        {entries.length > 0 && (
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-600">
                <tr>
                  <th className="text-left px-4 py-2">Source Path</th>
                  <th className="text-left px-4 py-2">Target Path</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-700 border-t border-gray-700">
                    <td className="px-4 py-2 font-mono text-sm">{entry.source}</td>
                    <td className="px-4 py-2 font-mono text-sm">{entry.target ?? "-"}</td>
                    {entry.processed === undefined ? (
                      <td className="px-4 py-2 text-center">-</td>
                    ) : (
                      <td className="px-4 py-2 text-center">
                        {entry.processed ? (
                          <span className="text-green-500">●</span>
                        ) : (
                          <span className="text-gray-400">○</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
