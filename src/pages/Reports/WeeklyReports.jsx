import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const renderInlineFormatting = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-zinc-150">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-zinc-300">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs text-primary font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const parseMarkdownTable = (tableLines, tableKey) => {
    if (tableLines.length < 2) return null;
    
    const rows = tableLines.map(line => {
      return line.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    });

    const isSeparator = rows[1]?.every(cell => /^:-*-:?$|^-+$/.test(cell));
    if (!isSeparator) return null;

    const headers = rows[0];
    const bodyRows = rows.slice(2);

    return (
      <div key={tableKey} className="overflow-x-auto my-4 rounded-xl border border-zinc-900 shadow-lg bg-zinc-950/40 print:border-zinc-300">
        <table className="w-full border-collapse text-left text-xs font-sans print:text-zinc-950">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800 print:bg-zinc-100 print:border-zinc-350">
              {headers.map((h, i) => (
                <th key={i} className="p-4 font-bold text-zinc-150 uppercase tracking-wider text-[10px] print:text-zinc-900">
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60 print:divide-zinc-200">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/20 transition-colors print:hover:bg-transparent">
                {row.map((cell, cIdx) => {
                  const cellLines = cell.split(/<br\s*\/?>/i);
                  return (
                    <td key={cIdx} className="p-4 text-zinc-300 leading-relaxed align-top print:text-zinc-800">
                      {cellLines.map((line, lIdx) => (
                        <div key={lIdx} className="my-1">
                          {renderInlineFormatting(line)}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMarkdown = (text) => {
    if (!text) return <p className="text-xs text-muted-foreground">Report content is empty.</p>;
    
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return (
      <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed max-w-3xl print:text-zinc-950">
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const lang = match ? match[1] : 'code';
            const code = match ? match[2] : part.slice(3, -3);
            
            return (
              <div key={idx} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 font-mono text-xs my-3 shadow-sm print:border-zinc-300 print:bg-white">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] text-muted-foreground uppercase font-bold tracking-wider print:bg-zinc-50 print:border-zinc-200 print:text-zinc-800">
                  <span>{lang || 'code'}</span>
                </div>
                <pre className="p-4 overflow-x-auto text-zinc-300 select-all leading-relaxed whitespace-pre print:text-zinc-900">{code}</pre>
              </div>
            );
          } else {
            const lines = part.split('\n');
            const elements = [];
            let currentTableLines = [];

            const flushTable = () => {
              if (currentTableLines.length > 0) {
                const tableKey = `table-${idx}-${elements.length}`;
                const tableElement = parseMarkdownTable(currentTableLines, tableKey);
                if (tableElement) {
                  elements.push(tableElement);
                } else {
                  currentTableLines.forEach((tLine) => {
                    elements.push(
                      <p key={`fb-${idx}-${elements.length}`} className="my-1.5 print:text-zinc-950">
                        {renderInlineFormatting(tLine)}
                      </p>
                    );
                  });
                }
                currentTableLines = [];
              }
            };

            lines.forEach((line) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('|')) {
                currentTableLines.push(line);
              } else {
                flushTable();

                if (!trimmed) return;
                
                if (trimmed.startsWith('---') || trimmed.replace(/^[*-]\s*/, '').startsWith('---')) {
                  elements.push(<hr key={`hr-${idx}-${elements.length}`} className="border-zinc-900 my-4 print:border-zinc-200" />);
                } else if (trimmed.startsWith('# ')) {
                  elements.push(
                    <h1 key={`h1-${idx}-${elements.length}`} className="text-xl font-extrabold text-foreground border-b border-zinc-900 pb-2 mt-6 font-mono tracking-tight print:text-zinc-950 print:border-zinc-300">
                      {trimmed.replace(/^#\s+/, '')}
                    </h1>
                  );
                } else if (trimmed.startsWith('## ')) {
                  elements.push(
                    <h2 key={`h2-${idx}-${elements.length}`} className="text-lg font-bold text-zinc-150 border-b border-zinc-900/60 pb-1 mt-5 font-mono tracking-tight print:text-zinc-900 print:border-zinc-300">
                      {trimmed.replace(/^##\s+/, '')}
                    </h2>
                  );
                } else if (trimmed.startsWith('### ')) {
                  elements.push(
                    <h3 key={`h3-${idx}-${elements.length}`} className="text-base font-bold text-primary mt-4 font-mono tracking-tight print:text-zinc-900">
                      {trimmed.replace(/^###\s+/, '')}
                    </h3>
                  );
                } else if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                  elements.push(
                    <li key={`li-${idx}-${elements.length}`} className="ml-5 list-disc pl-1 text-zinc-300 marker:text-primary print:text-zinc-900">
                      {renderInlineFormatting(trimmed.replace(/^[*-]\s+/, ''))}
                    </li>
                  );
                } else {
                  elements.push(
                    <p key={`p-${idx}-${elements.length}`} className="my-1.5 print:text-zinc-950">
                      {renderInlineFormatting(line)}
                    </p>
                  );
                }
              }
            });

            flushTable();

            return <div key={idx} className="space-y-2">{elements}</div>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 animate-fade-in print:h-auto print:gap-0">
      {/* Left panel: Weekly reports index */}
      <div className="w-full md:w-80 border border-zinc-900 bg-zinc-950/40 rounded-xl flex flex-col overflow-hidden glass-panel shrink-0 print:hidden">
        <div className="p-4 border-b border-zinc-900 flex items-center bg-card/30">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Digests Archive
          </h3>
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
