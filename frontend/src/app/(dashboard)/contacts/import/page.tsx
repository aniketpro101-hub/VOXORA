'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';

export default function ContactImportPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[]; totalRows: number; previewRows: any[]; rawRows: any[] } | null>(null);

  const [mapping, setMapping] = useState<Record<string, string>>({
    phone: '',
    name: '',
    email: '',
    city: '',
    company: '',
  });

  const [validationResult, setValidationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsLoading(true);
    try {
      const res = await apiClient.post('/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data.data;
      setParsedData(data);

      // Auto-detect column mapping
      const autoMap: Record<string, string> = { phone: '', name: '', email: '', city: '', company: '' };
      data.headers.forEach((h: string) => {
        const lower = h.toLowerCase();
        if (lower.includes('phone') || lower.includes('mobile') || lower.includes('number')) autoMap.phone = h;
        else if (lower.includes('name')) autoMap.name = h;
        else if (lower.includes('email')) autoMap.email = h;
        else if (lower.includes('city') || lower.includes('location')) autoMap.city = h;
        else if (lower.includes('company')) autoMap.company = h;
      });

      setMapping(autoMap);
      setStep(2);
      toast.success(`Parsed ${data.totalRows} rows from file`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to parse Excel/CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/import/template`, '_blank');
  };

  const handleValidateMapping = async () => {
    if (!mapping.phone) {
      toast.error('Please map the Phone Number column');
      return;
    }
    if (!parsedData?.rawRows) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post('/import/validate', {
        rows: parsedData.rawRows,
        mapping,
      });

      setValidationResult(res.data.data);
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult?.validRows) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post('/import/confirm', {
        validRows: validationResult.validRows,
      });

      toast.success(`Successfully imported ${res.data.data.insertedCount} contacts!`);
      setStep(1);
      setFile(null);
      setParsedData(null);
      setValidationResult(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Import Contacts (Excel / CSV)</h1>
          <p className="text-sm text-muted-foreground">
            Bulk upload leads, auto-map columns, detect duplicates, and clean invalid phone numbers.
          </p>
        </div>

        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-4 w-4 text-primary" /> Download Sample Template
        </Button>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between border border-border bg-card p-4 rounded-2xl shadow-sm">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step >= 1 ? 'bg-primary text-white' : 'bg-accent'}`}>1</div>
          <span className="text-xs">Upload File</span>
        </div>
        <div className="h-0.5 w-12 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step >= 2 ? 'bg-primary text-white' : 'bg-accent'}`}>2</div>
          <span className="text-xs">Column Mapping</span>
        </div>
        <div className="h-0.5 w-12 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step >= 3 ? 'bg-primary text-white' : 'bg-accent'}`}>3</div>
          <span className="text-xs">Preview & Confirm</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD FILE */}
      {step === 1 && (
        <Card className="p-12 text-center border-2 border-dashed border-border hover:border-primary/50 transition-all">
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4">
              <FileSpreadsheet className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Drop your Excel (.xlsx, .xls) or CSV file here</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">Supports up to 50,000 rows per import</p>

            <Button isLoading={isLoading} type="button">
              <Upload className="mr-2 h-4 w-4" /> Browse Excel / CSV File
            </Button>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </Card>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {step === 2 && (
        <Card className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Map Your Excel Columns</h3>
              <p className="text-xs text-muted-foreground">Select which column in your file corresponds to each Voxora CRM field.</p>
            </div>
            <Badge variant="purple">{parsedData?.totalRows} Total Rows</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['phone', 'name', 'email', 'city', 'company'].map((field) => (
              <div key={field} className="space-y-1.5 p-3 rounded-2xl border border-border bg-accent/20">
                <label className="text-xs font-bold capitalize text-foreground flex items-center justify-between">
                  <span>{field === 'phone' ? 'Phone Number *' : field}</span>
                  {field === 'phone' && <Badge variant="danger">Required</Badge>}
                </label>
                <select
                  value={mapping[field] || ''}
                  onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none"
                >
                  <option value="">-- Do Not Import --</option>
                  {parsedData?.headers.map((h) => (
                    <option key={h} value={h}>
                      Column: "{h}"
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
            </Button>
            <Button onClick={handleValidateMapping} isLoading={isLoading}>
              Validate & Preview <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: PREVIEW & VALIDATE */}
      {step === 3 && validationResult && (
        <Card className="space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground">Import Validation Summary</h3>
            <p className="text-xs text-muted-foreground">Review validation breakdown before final import.</p>
          </div>

          {/* Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-foreground">{validationResult.validCount}</p>
              <p className="text-xs text-muted-foreground">Valid Contacts</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-foreground">{validationResult.duplicateCount}</p>
              <p className="text-xs text-muted-foreground">Duplicates (Skipped)</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <XCircle className="h-6 w-6 text-rose-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-foreground">{validationResult.invalidCount}</p>
              <p className="text-xs text-muted-foreground">Invalid Format</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
              <ShieldAlert className="h-6 w-6 text-purple-400 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-foreground">{validationResult.blacklistedCount}</p>
              <p className="text-xs text-muted-foreground">Blacklisted</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Sample Preview (First 10 Valid Rows)</label>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent/50 border-b border-border font-bold text-foreground">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validationResult.validRows.slice(0, 10).map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-accent/20">
                      <td className="p-3 font-semibold text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-bold text-primary">{r.phone}</td>
                      <td className="p-3 text-foreground">{r.name || '—'}</td>
                      <td className="p-3 text-muted-foreground">{r.city || '—'}</td>
                      <td className="p-3 text-muted-foreground">{r.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Edit Mapping
            </Button>
            <Button onClick={handleConfirmImport} isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="mr-2 h-4 w-4" /> Import {validationResult.validCount} Contacts
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
