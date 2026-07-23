'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListMenuData {
  title: string;
  description: string;
  buttonText: string;
  sections: ListSection[];
}

interface ListMenuBuilderProps {
  data: ListMenuData;
  onChange: (data: ListMenuData) => void;
}

export default function ListMenuBuilder({ data, onChange }: ListMenuBuilderProps) {
  const handleAddSection = () => {
    onChange({
      ...data,
      sections: [...data.sections, { title: `Section ${data.sections.length + 1}`, rows: [] }],
    });
  };

  const handleAddRow = (sectionIndex: number) => {
    const totalRows = data.sections.reduce((sum, s) => sum + s.rows.length, 0);
    if (totalRows >= 10) return;

    const updated = [...data.sections];
    updated[sectionIndex].rows.push({
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: 'New Option',
      description: '',
    });

    onChange({ ...data, sections: updated });
  };

  return (
    <div className="space-y-4">
      <label className="text-xs font-semibold uppercase text-muted-foreground">List Menu Options</label>

      <div className="space-y-3">
        <Input
          label="Menu Title"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
        <Input
          label="Button Label (e.g. Choose Option)"
          value={data.buttonText}
          onChange={(e) => onChange({ ...data, buttonText: e.target.value })}
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {data.sections.map((sec, sIdx) => (
          <div key={sIdx} className="p-4 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={sec.title}
                onChange={(e) => {
                  const updated = [...data.sections];
                  updated[sIdx].title = e.target.value;
                  onChange({ ...data, sections: updated });
                }}
                className="font-bold text-sm bg-transparent border-b border-border focus:outline-none"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleAddRow(sIdx)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {sec.rows.map((r, rIdx) => (
                <div key={r.id} className="p-2.5 rounded-xl border border-border bg-accent/30 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Item Title"
                      value={r.title}
                      onChange={(e) => {
                        const updated = [...data.sections];
                        updated[sIdx].rows[rIdx].title = e.target.value;
                        onChange({ ...data, sections: updated });
                      }}
                      className="text-xs font-semibold bg-transparent border-b border-border w-full focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = [...data.sections];
                        updated[sIdx].rows.splice(rIdx, 1);
                        onChange({ ...data, sections: updated });
                      }}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Short Description (optional)"
                    value={r.description || ''}
                    onChange={(e) => {
                      const updated = [...data.sections];
                      updated[sIdx].rows[rIdx].description = e.target.value;
                      onChange({ ...data, sections: updated });
                    }}
                    className="text-[11px] text-muted-foreground bg-transparent w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleAddSection} className="w-full">
        <Plus className="mr-1.5 h-4 w-4" /> Add List Section
      </Button>
    </div>
  );
}
