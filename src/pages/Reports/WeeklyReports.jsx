import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Calendar, 
  Plus, 
  ChevronRight, 
  Sparkles,
  Download,
  Copy,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportService } from '@/services/reportService';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const WeeklyReports = () => {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['reports', 'list'],
    queryFn: reportService.getWeeklyReports
  });

  // Select first report by default
  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [reports, selectedReport]);

  // Fetch details of a specific report on selection
  const { data: reportDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['reports', 'detail', selectedReport?.id],
    queryFn: () => reportService.getWeeklyReport(selectedReport.id),
    enabled: !!selectedReport?.id
  });

  // Manual trigger compilation mutation
  const compileMutation = useMutation({
    mutationFn: reportService.compileWeeklyReport,
    onSuccess: (data) => {
      toast.success(`Digest Compiled: ${data.title}`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedReport(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to compile report. Verify DB has at least 5 new news items.';
      toast.error(msg);
    }
  });

  const handleDownload = (report) => {
    if (!report) return;
    const blob = new Blob([report.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `devpatrika-weekly-${report.id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded report as Markdown file.');
  };

  const handleCopy = (report) => {
    if (!report) return;
    navigator.clipboard.writeText(report.content);
    toast.success('Copied markdown text to clipboard.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert markdown structure into styled SaaS-grade view
  const renderMarkdown = (text) => {
    if (!text) return <p className="text-xs text-muted-foreground">Report content is empty.</p>;
    const lines = text.split('\n');
    return (
      <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed max-w-3xl print:text-zinc-950">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl font-extrabold text-foreground border-b border-zinc-900 pb-2 mt-6 font-mono tracking-tight print:text-zinc-950 print:border-zinc-300">
                {trimmed.replace(/^#\s+/, '')}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-bold text-zinc-150 border-b border-zinc-900/60 pb-1 mt-5 font-mono tracking-tight print:text-zinc-900 print:border-zinc-300">
                {trimmed.replace(/^##\s+/, '')}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-primary mt-4 font-mono tracking-tight print:text-zinc-900">
                {trimmed.replace(/^###\s+/, '')}
              </h3>
            );
          }
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            return (
              <li key={idx} className="ml-5 list-disc pl-1 text-zinc-300 marker:text-primary print:text-zinc-900">
                {trimmed.replace(/^[*-]\s+/, '')}
              </li>
            );
          }
          return trimmed ? <p key={idx} className="my-1.5 print:text-zinc-950">{trimmed}</p> : null;
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 animate-fade-in print:h-auto print:gap-0">
      {/* Left panel: Weekly reports index */}
      <div className="w-full md:w-80 border border-zinc-900 bg-zinc-950/40 rounded-xl flex flex-col overflow-hidden glass-panel shrink-0 print:hidden">
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-card/30">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Digests Archive
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => compileMutation.mutate()}
            isLoading={compileMutation.isPending}
            className="h-7 px-2 border-zinc-800 hover:border-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Compile
          </Button>
        </div>

        {/* List index */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Error fetching digests.
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-500 italic">
              No reports compiled.
            </div>
          ) : (
            reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-md text-xs font-mono transition-all text-left group ${
                  selectedReport?.id === r.id
                    ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-foreground border border-transparent'
                }`}
              >
                <div className="flex flex-col gap-0.5 truncate mr-2">
                  <span className="truncate">{r.title}</span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 text-zinc-650 transition-transform group-hover:translate-x-0.5 ${
                  selectedReport?.id === r.id ? 'text-primary' : ''
                }`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Active digest view */}
      <div className="flex-1 border border-zinc-900 bg-zinc-950/40 rounded-xl flex flex-col overflow-hidden glass-panel print:border-none print:bg-transparent">
        {selectedReport ? (
          <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
            {/* Header info */}
            <div className="p-6 border-b border-zinc-900 bg-card/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 print:border-zinc-300 print:p-0 print:pb-4">
              <div>
                <h2 className="text-xl font-bold font-mono tracking-tight text-foreground">{selectedReport.title}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Date Compiled: {new Date(selectedReport.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action buttons (copy, print, download) */}
              <div className="flex items-center gap-2 shrink-0 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(reportDetails || selectedReport)}
                  className="h-8 border-zinc-850 hover:border-zinc-700 text-xs px-2.5"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 border-zinc-850 hover:border-zinc-700 text-xs px-2.5"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(reportDetails || selectedReport)}
                  className="h-8 border-zinc-850 hover:border-zinc-700 text-xs px-2.5"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>

            {/* Scrollable Report Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin print:p-0 print:overflow-visible print:h-auto">
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                renderMarkdown(reportDetails?.content || selectedReport.content)
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground print:hidden">
            <Sparkles className="h-10 w-10 text-zinc-750 mb-2 animate-pulse" />
            <p className="text-sm font-semibold">No Report selected.</p>
            <p className="text-xs max-w-xs mt-1">
              Select compiled digest from the left archive index or manually trigger new compilation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReports;
