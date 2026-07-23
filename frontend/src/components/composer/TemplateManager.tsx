'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Save, FolderOpen, Trash2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export interface SavedTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  messageText: string;
  mediaUrl?: string;
  buttons?: any[];
  listMenu?: any;
  updatedAt: string;
}

interface TemplateManagerProps {
  onLoadTemplate: (template: SavedTemplate) => void;
  currentMessageText?: string;
  currentMediaUrl?: string;
  currentButtons?: any[];
  currentListMenu?: any;
}

const STORAGE_KEY = 'voxora_saved_templates';

export default function TemplateManager({
  onLoadTemplate,
  currentMessageText,
  currentMediaUrl,
  currentButtons,
  currentListMenu,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  // Save Modal Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Promotional');
  const [description, setDescription] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTemplates(JSON.parse(stored));
      } else {
        // Pre-populate sample template
        const defaults: SavedTemplate[] = [
          {
            id: 'tpl_diwali_1',
            name: '🎉 Festival Promo Offer',
            category: 'Promotional',
            description: 'Special festival discount text with SpinTax',
            messageText: '{Hi|Hello} {{name}}, special festival discount for customers in {{city}}! Get 30% OFF today.',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'tpl_welcome_2',
            name: '👋 New Customer Welcome',
            category: 'Welcome',
            description: 'Onboarding welcome message',
            messageText: 'Welcome {{name}}! Thank you for joining us. Reply MENU to see our services.',
            updatedAt: new Date().toISOString(),
          },
        ];
        setTemplates(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch (e) {}
  }, []);

  const saveTemplatesToStorage = (list: SavedTemplate[]) => {
    setTemplates(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const newTpl: SavedTemplate = {
      id: `tpl_${Date.now()}`,
      name: name.trim(),
      category,
      description,
      messageText: currentMessageText || '',
      mediaUrl: currentMediaUrl,
      buttons: currentButtons,
      listMenu: currentListMenu,
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTpl, ...templates];
    saveTemplatesToStorage(updated);
    toast.success(`Template "${name}" saved!`);
    setIsSaveModalOpen(false);
    setName('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplatesToStorage(updated);
    toast.success('Template deleted');
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setIsLoadModalOpen(true)}>
        <FolderOpen className="mr-1.5 h-4 w-4 text-primary" /> Load Template
      </Button>

      <Button type="button" variant="outline" size="sm" onClick={() => setIsSaveModalOpen(true)}>
        <Save className="mr-1.5 h-4 w-4 text-emerald-500" /> Save as Template
      </Button>

      {/* Save Template Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Save className="h-5 w-5 text-emerald-500" /> Save Message Template
            </h3>

            <Input label="Template Name *" placeholder="e.g. Diwali Flash Sale" value={name} onChange={(e) => setName(e.target.value)} />

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-accent/40 p-2.5 text-xs text-foreground focus:outline-none"
              >
                <option value="Promotional">Promotional</option>
                <option value="Welcome">Welcome</option>
                <option value="Transactional">Transactional</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>

            <Input label="Description (optional)" placeholder="Brief summary..." value={description} onChange={(e) => setDescription(e.target.value)} />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Load Template Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" /> Load Saved Template
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsLoadModalOpen(false)}>
                ✕
              </Button>
            </div>

            <div className="space-y-3">
              {templates.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-xs">No saved templates found.</div>
              )}
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-4 rounded-2xl border border-border bg-accent/30 space-y-2 hover:border-primary/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{tpl.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-card/60 p-2 rounded-xl border border-border">
                    {tpl.messageText}
                  </p>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      Updated: {new Date(tpl.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(tpl.id)} className="text-rose-500 hover:text-rose-600 p-1 text-xs">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Button
                        size="sm"
                        onClick={() => {
                          onLoadTemplate(tpl);
                          setIsLoadModalOpen(false);
                          toast.success(`Loaded template: ${tpl.name}`);
                        }}
                      >
                        Load Template
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
