import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Button';

export default function List({ rules }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (ruleId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRows(newExpanded);
  };

  const handleLogout = () => {
    router.post('logout');
  };

  const handleUndo = (ruleId) => {
    if (confirm('Are you sure you want to remove this rule?')) {
      router.post('/remove', { rule_id: ruleId }, {
        preserveScroll: true,
        onSuccess: () => router.reload()
      });
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Rule List" />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Managed Rules</h1>
          <div className="flex gap-4">
            <Button variant="primary" asChild>
              <Link href="/new">Create New Rule</Link>
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {rules.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Source Directory</th>
                  <th className="p-2 text-left">Target Directory</th>
                  <th className="p-2 text-left">Patterns</th>
                  <th className="p-2"></th>
                </tr>
              </thead>

              <tbody>
                {rules.map((rule) => (
                  <div key={rule.id}>
                    <tr className="hover:bg-gray-50 border-t">
                      <td className="p-2 font-mono text-sm max-w-[300px] truncate">
                        {rule.source_dir}
                      </td>
                      
                      <td className="p-2 font-mono text-sm max-w-[300px] truncate">
                        {rule.target_dir}
                      </td>

                      <td className="p-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                            {rule.include_pattern}
                          </span>
                          {rule.exclude_pattern && (
                            <span className="font-mono text-sm bg-red-100 px-2 py-1 rounded text-red-700">
                              {rule.exclude_pattern}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-2">
                        <Button
                          variant="text"
                          onClick={() => toggleRow(rule.id)}
                          className="p-1"
                        >
                          {expandedRows.has(rule.id) ? '▲' : '▼'}
                        </Button>
                      </td>
                    </tr>

                    {expandedRows.has(rule.id) && (
                      <tr>
                        <td colSpan={4} className="p-4 border-t">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold mb-2">Files Mapping</h3>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 rounded bg-gray-50">
                                  <h4 className="font-medium mb-1">Source Path</h4>
                                  <p className="font-mono text-sm break-all">
                                    {rule.source_dir}
                                  </p>
                                </div>

                                <div className="p-3 rounded bg-gray-50">
                                  <h4 className="font-medium mb-1">Target Path</h4>
                                  <p className="font-mono text-sm break-all">
                                    {rule.target_dir}
                                  </p>
                                </div>
                              </div>

                              <div className="border rounded overflow-hidden">
                                <table className="w-full">
                                  <tbody>
                                    {rule.mappings.map((mapping, index) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="p-2 text-sm font-mono border-b">
                                          {mapping.source_name}
                                        </td>
                                        <td className="p-2 text-sm text-center border-b">→</td>
                                        <td className="p-2 text-sm font-mono border-b">
                                          {mapping.target_name}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                asChild
                              >
                                <Link href={`/edit/${rule.id}`}>Edit</Link>
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleUndo(rule.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </div>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No rules created yet. Click the button above to create a new rule.
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
