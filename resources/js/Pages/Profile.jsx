import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Button';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function Profile({ defaults }) {
  const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
    source_dir: defaults.source_dir || '',
    target_dir: defaults.target_dir || '',
    include_pattern: defaults.include_pattern || '',
    exclude_pattern: defaults.exclude_pattern || '',
    target_template: defaults.target_template || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/profile');
  };

  return (
    <AuthenticatedLayout>
      <Head title="Profile Settings" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Default Settings</h1>
          <Button>
            <Link href="/">{"< Back"}</Link>
          </Button>
        </div>

        {recentlySuccessful && (
          <div className="bg-green-500 text-white p-4 rounded">
            Default settings saved successfully
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <InputLabel forInput="source_dir" value="Default Source Directory" />
            <TextInput
              name="source_dir"
              value={data.source_dir}
              handleChange={(e) => setData('source_dir', e.target.value)}
              className="mt-1 block w-full text-black"
              placeholder="/path/to/source"
            />
            {errors.source_dir && (
              <InputError message={errors.source_dir} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="target_dir" value="Default Target Directory" />
            <TextInput
              name="target_dir"
              value={data.target_dir}
              handleChange={(e) => setData('target_dir', e.target.value)}
              className="mt-1 block w-full text-black"
              placeholder="/path/to/target"
            />
            {errors.target_dir && (
              <InputError message={errors.target_dir} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="include_pattern" value="Default Include Pattern (RegEx)" />
            <TextInput
              name="include_pattern"
              value={data.include_pattern}
              handleChange={(e) => setData('include_pattern', e.target.value)}
              className="mt-1 block w-full text-black"
              placeholder="/(.*)/"
            />
            {errors.include_pattern && (
              <InputError message={errors.include_pattern} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="exclude_pattern" value="Default Exclude Pattern (RegEx)" />
            <TextInput
              name="exclude_pattern"
              value={data.exclude_pattern}
              handleChange={(e) => setData('exclude_pattern', e.target.value)}
              className="mt-1 block w-full text-black"
              placeholder="(A|B)"
            />
            {errors.exclude_pattern && (
              <InputError message={errors.exclude_pattern} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <InputLabel forInput="target_template" value="Default Target Template" />
            <TextInput
              name="target_template"
              value={data.target_template}
              handleChange={(e) => setData('target_template', e.target.value)}
              className="mt-1 block w-full text-black"
              placeholder="New File Name $1+1.$2"
            />
            {errors.target_template && (
              <InputError message={errors.target_template} className="mt-2" />
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={processing}
            >
              {processing ? 'Saving...' : 'Save as Default'}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
