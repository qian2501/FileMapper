import axios from 'axios';
import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Entry {
  source: string;
  target?: string;
  processed?: boolean;
}

export default function New() {
  const [formData, setFormData] = useState({
    source_dir: '',
    target_dir: '',
    include_pattern: '',
    exclude_pattern: '',
    target_template: '',
  });

  const [entries, setEntries] = useState<Entry[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAction = async (endpoint: string) => {
    switch (endpoint) {
      case 'scan':
        setIsScanning(true);
        break;
      case 'preview':
        setIsPreviewing(true);
        break;
      case 'apply':
        setIsApplying(true);
        break;
    }

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
    } finally {
      switch (endpoint) {
        case 'scan':
          setIsScanning(false);
          break;
        case 'preview':
          setIsPreviewing(false);
          break;
        case 'apply':
          setIsApplying(false);
          break;
      }
    }
  };

  return (
    <div>
      <Head title="New Rule" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Rule</h1>
          <Button variant="outline" asChild>
            <Link href="/">&lt; Back</Link>
          </Button>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="source_dir">Source Directory</Label>
            <Input
              name="source_dir"
              value={formData.source_dir}
              onChange={handleInputChange}
              placeholder="/path/to/source"
            />
            {formErrors.source_dir && (
              <InputError message={formErrors.source_dir[0]} />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_dir">Target Directory</Label>
            <Input
              name="target_dir"
              value={formData.target_dir}
              onChange={handleInputChange}
              placeholder="/path/to/target"
            />
            {formErrors.target_dir && (
              <InputError message={formErrors.target_dir[0]} />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="include_pattern">Include Pattern (RegEx)</Label>
            <Input
              name="include_pattern"
              value={formData.include_pattern}
              onChange={handleInputChange}
              placeholder="/(.*)/"
            />
            {formErrors.include_pattern && (
              <InputError message={formErrors.include_pattern[0]} />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exclude_pattern">Exclude Pattern (RegEx)</Label>
            <Input
              name="exclude_pattern"
              value={formData.exclude_pattern}
              onChange={handleInputChange}
              placeholder="(A|B)"
            />
            {formErrors.exclude_pattern && (
              <InputError message={formErrors.exclude_pattern[0]} />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_template">Target Template</Label>
            <Input
              name="target_template"
              value={formData.target_template}
              onChange={handleInputChange}
              placeholder="New ($1) File Name.$2"
            />
            {formErrors.target_template && (
              <InputError message={formErrors.target_template[0]} />
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => handleAction('scan')}
              disabled={isScanning}
            >
              {isScanning && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
              Scan
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction('preview')}
              disabled={isPreviewing}
            >
              {isPreviewing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
              Preview
            </Button>

            <Button
              onClick={() => handleAction('apply')}
              disabled={isApplying}
            >
              {isApplying && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
              Apply
            </Button>
          </div>
        </form>

        {entries.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2">Source Path</th>
                  <th className="text-left px-4 py-2">Target Path</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className="hover:bg-muted/50 border-t">
                    <td className="px-4 py-2 font-mono text-sm">{entry.source}</td>
                    <td className="px-4 py-2 font-mono text-sm">{entry.target ?? "-"}</td>
                    {entry.processed === undefined ? (
                      <td className="px-4 py-2 text-center">-</td>
                    ) : (
                      <td className="px-4 py-2 text-center">
                        {entry.processed ? (
                          <span className="text-green-500">●</span>
                        ) : (
                          <span className="text-muted-foreground">○</span>
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
    </div>
  );
}