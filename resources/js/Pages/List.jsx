import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Button';
import CodeBlock from '@/Components/CodeBlock';

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
            <Button variant="primary">
              <Link href="/new">Create New Rule</Link>
            </Button>
          </div>
        </div>

        {rules.length > 0 ? (
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-600">
                <tr>
                  <th className="p-2 text-left w-[30%]">Source Directory</th>
                  <th className="p-2 text-left w-[30%]">Target Directory</th>
                  <th className="p-2 text-left w-[35%]">Patterns</th>
                  <th className="p-2 w-[5%]"></th>
                </tr>
              </thead>

              <tbody>
                {rules.map((rule) => (
                  <React.Fragment key={rule.id}>
                    <tr className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="p-2 font-mono text-sm truncate">
                        {rule.source_dir}
                      </td>
                      
                      <td className="p-2 font-mono text-sm truncate">
                        {rule.target_dir}
                      </td>

                      <td className="p-2 font-mono text-sm">
                        <div className="flex gap-1">
                          <CodeBlock className="bg-green-700 px-2 py-1">
                            {rule.include_pattern}
                          </CodeBlock>
                          {rule.exclude_pattern && (
                            <CodeBlock className="bg-red-700 px-2 py-1">
                              {rule.exclude_pattern}
                            </CodeBlock>
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
                        <td colSpan={4} className="p-4 border-t border-gray-700">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold mb-2">Files Mapping</h3>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="font-medium mb-1">Source Path</h4>
                                  <CodeBlock className="p-2">
                                      {rule.source_dir}
                                  </CodeBlock>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-1">Target Path</h4>
                                  <CodeBlock className="p-2">
                                      {rule.target_dir}
                                  </CodeBlock>
                                </div>
                              </div>

                              <div className="border border-gray-700 rounded overflow-hidden">
                                <table className="w-full">
                                  <tbody>
                                    {rule.mappings.map((mapping, index) => (
                                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                                        <td className="p-2 text-sm font-mono">
                                          {mapping.source_name}
                                        </td>
                                        <td className="p-2 text-sm text-center">→</td>
                                        <td className="p-2 text-sm font-mono">
                                          {mapping.target_name}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button>
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
                  </React.Fragment>
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
