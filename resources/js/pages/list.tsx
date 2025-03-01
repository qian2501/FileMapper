import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import React from 'react';

interface Rule {
  id: number;
  source_dir: string;
  target_dir: string;
  include_pattern: string;
  exclude_pattern: string;
  target_template: string;
  mappings: {
    id: number;
    source_name: string;
    target_name: string;
    processed: boolean;
  }[];
}

interface ListProps {
  rules: Rule[];
}

export default function List({ rules }: ListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (ruleId: number) => {
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

  const handleUndo = (ruleId: number) => {
    if (confirm('Are you sure you want to remove this rule?')) {
      router.post('/remove', { rule_id: ruleId }, {
        preserveScroll: true,
        onSuccess: () => router.reload()
      });
    }
  };

  return (
    <div className='w-4/5 m-auto py-6'>
      <Head title="Rule List" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Managed Rules</h2>
          <div>
            <Button className='mr-2'>
              <Link href="/new">Create New Rule</Link>
            </Button>

            <Button variant="destructive" onClick={() => handleLogout()}>
              <Link href={route('logout')}>Logout</Link>
            </Button>
          </div>
        </div>

        {rules.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-gray-300">

              <thead>
                <tr className="bg-gray-300">
                  <th className="p-2 text-left text-black">Source Directory</th>
                  <th className="p-2 text-left text-black">Target Directory</th>
                  <th className="p-2 text-left text-black">Patterns</th>
                  <th className="p-2 text-left text-black"></th>
                </tr>
              </thead>

              <tbody>
                {rules.map((rule) => (
                  <React.Fragment key={rule.id}>
                    <tr key={rule.id} className="border hover:bg-gray-800">
                      <td className="p-2 font-mono text-sm max-w-[300px] truncate">
                        {rule.source_dir}
                      </td>
                      
                      <td className="p-2 font-mono text-sm max-w-[300px] truncate">
                        {rule.target_dir}
                      </td>

                      <td className="p-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm bg-gray-300 px-2 py-1 rounded text-black">
                            {rule.include_pattern}
                          </span>
                          {rule.exclude_pattern && (
                            <span className="font-mono text-sm bg-red-200 px-2 py-1 rounded text-red-700">
                              {rule.exclude_pattern}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(rule.id)}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedRows.has(rule.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </td>
                    </tr>

                    {expandedRows.has(rule.id) && (
                      <tr className="">
                        <td colSpan={4} className="border p-2">
                          <div className="flex flex-col gap-6 p-4">

                            <div>
                              <h3 className="font-semibold mb-3 text-lg">Files Mapping</h3>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <tbody>
                                    {rule.mappings.map((mapping, index) => (
                                      <tr key={index}>
                                        <td className="p-2 text-sm font-medium align-middle border-b">
                                          {mapping.source_name}
                                        </td>
                                        <td className="p-2 text-sm font-medium text-center align-middle border-b w-1/6">&gt;</td>
                                        <td className="p-2 text-sm font-medium align-middle border-b">
                                          {mapping.target_name}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className='flex justify-end'>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUndo(rule.id)}
                              >
                                Remove This Rule
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
          <div className="p-8 text-center text-muted-foreground">
            No rules created yet. Click the button above to create a new rule.
          </div>
        )}
      </div>
    </div>
  );
}