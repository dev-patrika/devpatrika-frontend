import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Calendar, 
  ChevronRight, 
  Download,
  Copy,
  Printer,
  Activity,
  Menu,
  X,
  Columns,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportService } from '@/services/reportService';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const WeeklyReports = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);
  const [showArchive, setShowArchive] = useState(true);

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
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-muted-foreground">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-primary font-mono">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [_, linkText, linkUrl] = match;
          return (
            <a
              key={idx}
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5 font-bold cursor-pointer"
            >
              {linkText}
            </a>
          );
        }
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
      <div key={tableKey} className="overflow-x-auto my-4 rounded-xl border border-border shadow-sm bg-muted/30 print:border-zinc-300">
        <table className="w-full border-collapse text-left text-xs font-mono print:text-zinc-950">
          <thead>
            <tr className="bg-muted border-b border-border print:bg-zinc-100 print:border-zinc-350">
              {headers.map((h, i) => (
                <th key={i} className="p-3 font-bold text-foreground uppercase tracking-wider text-[9px] print:text-zinc-900">
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 print:divide-zinc-200">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/10 transition-colors print:hover:bg-transparent">
                {row.map((cell, cIdx) => {
                  const cellLines = cell.split(/<br\s*\/?>/i);
                  return (
                    <td key={cIdx} className="p-3 text-foreground/80 leading-relaxed align-top print:text-zinc-800">
                      {cellLines.map((line, lIdx) => (
                        <div key={lIdx} className="my-0.5">
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

  const renderNewspaperMarkdown = (text) => {
    if (!text) return <p className="text-sm text-muted-foreground italic">Report content is empty.</p>;

    const lines = text.split('\n');
    const elements = [];
    let isFirstParagraph = true;
    let currentTableLines = [];

    const flushTable = () => {
      if (currentTableLines.length > 0) {
        const tableKey = `table-${elements.length}`;
        const tableElement = parseMarkdownTable(currentTableLines, tableKey);
        if (tableElement) {
          elements.push(tableElement);
        } else {
          currentTableLines.forEach((tLine) => {
            elements.push(
              <p key={`fb-${elements.length}`} className="my-2.5 font-['Times_New_Roman',_Times,_serif] text-sm leading-relaxed text-foreground/90 text-justify justified-text">
                {renderInlineFormatting(tLine)}
              </p>
            );
          });
        }
        currentTableLines = [];
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('|')) {
        currentTableLines.push(line);
      } else {
        flushTable();

        if (!trimmed) return;

        if (trimmed.startsWith('---') || trimmed.replace(/^[*-]\s*/, '').startsWith('---')) {
          elements.push(<div key={`sep-${lineIdx}`} className="rule-h-double my-6" />);
        } 
        else if (trimmed.startsWith('# ') || (trimmed.startsWith('## ') && (trimmed.toLowerCase().includes('summary') || trimmed.toLowerCase().includes('stories') || trimmed.toLowerCase().includes('radar') || trimmed.toLowerCase().includes('glossary')))) {
          const headingText = trimmed.replace(/^#+\s+\d*\.?\s*/, '');
          elements.push(
            <div key={`h1-${lineIdx}`} className="mt-8 mb-4 border-b border-foreground/20 pb-2">
              <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight text-foreground">
                {headingText}
              </h2>
            </div>
          );
          isFirstParagraph = true;
        } 
        else if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^#+\s+/, '');
          elements.push(
            <h3 key={`h3-${lineIdx}`} className="text-sm md:text-base font-serif font-bold italic text-primary mt-6 mb-2.5 leading-snug">
              {headingText}
            </h3>
          );
        } 
        else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const listText = trimmed.replace(/^[*-]\s+/, '');
          elements.push(
            <li key={`li-${lineIdx}`} className="ml-5 list-disc pl-1 text-xs text-foreground/90 font-['Times_New_Roman',_Times,_serif] leading-relaxed my-1.5 marker:text-primary">
              {renderInlineFormatting(listText)}
            </li>
          );
        } 
        else {
          const formattedText = renderInlineFormatting(line);
          if (isFirstParagraph) {
            elements.push(
              <p key={`p-${lineIdx}`} className="drop-cap font-['Times_New_Roman',_Times,_serif] text-sm leading-relaxed text-foreground/95 text-justify justified-text mb-3">
                {formattedText}
              </p>
            );
            isFirstParagraph = false;
          } else {
            elements.push(
              <p key={`p-${lineIdx}`} className="font-['Times_New_Roman',_Times,_serif] text-sm leading-relaxed text-foreground/90 text-justify justified-text mb-3">
                {formattedText}
              </p>
            );
          }
        }
      }
    });

    flushTable();

    return (
      <div className="space-y-1">
        {elements}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col md:flex-row gap-6 animate-fade-in print:h-auto print:gap-0 relative">
      
      {/* Left panel: Weekly reports index (Archive) with show/hide toggle support */}
      {showArchive && (
        <div className="w-full md:w-80 border border-border bg-card/65 rounded-2xl flex flex-col overflow-hidden shrink-0 print:hidden shadow-sm transition-all duration-300">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <FileText className="h-4 w-4 text-primary" /> Digests Archive
            </h3>
            <button 
              onClick={() => setShowArchive(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              title="Hide Archive"
            >
              <X className="h-4 w-4" />
            </button>
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
              <div className="text-center py-12 text-xs text-muted-foreground italic">
                No reports compiled.
              </div>
            ) : (
              reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-mono transition-all text-left group ${
                    selectedReport?.id === r.id
                      ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 truncate mr-2">
                    <span className="truncate">{r.title}</span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 ${
                    selectedReport?.id === r.id ? 'text-primary' : ''
                  }`} />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button (Visible only when archive is hidden) */}
      {!showArchive && (
        <button
          onClick={() => setShowArchive(true)}
          title="Show Digests Archive"
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/95 text-white p-2.5 rounded-r-xl shadow-lg border border-l-0 border-border z-30 transition-all select-none hover:scale-105 flex items-center justify-center print:hidden"
        >
          <ChevronRight className="h-5 w-5 animate-pulse" />
        </button>
      )}

      {/* Right panel: Active digest view */}
      <div className="flex-1 border border-border bg-card rounded-2xl flex flex-col overflow-hidden shadow-sm print:border-none print:bg-transparent">
        {selectedReport ? (
          <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
            
            {/* Scrollable Newspaper Report Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin print:p-0 print:overflow-visible print:h-auto">
              
              {/* VINTAGE MASTHEAD */}
              <header className="mb-10 print:mb-6 border-b-2 border-foreground pb-4 select-none">
                <div className="flex justify-between items-end border-b border-foreground mb-1.5 pb-1">
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/80">EST. 2023   |   Vol. IV — No. 48</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/80">Bengaluru, IN   |   Global Edition</div>
                </div>
                
                <div className="py-6 flex flex-col items-center text-center">
                  <h1 className="font-serif text-5xl md:text-7xl font-black tracking-tighter leading-none italic text-foreground select-none">
                    Dev Patrika
                  </h1>
                  <div className="rule-h-double w-full mt-2"></div>
                  <h2 className="font-serif text-lg md:text-xl uppercase tracking-[0.25em] font-medium mt-3 text-foreground">
                    Weekly Digests
                  </h2>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-foreground text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Market Status: Bullish (+2.4%)</span>
                  <span>Compiled: {new Date(selectedReport.created_at).toLocaleDateString()}</span>
                  
                  {/* Actions shortcut in header */}
                  <div className="flex items-center gap-3 text-primary print:hidden font-sans text-[10px] font-bold">
                    <button onClick={() => handleCopy(reportDetails || selectedReport)} className="hover:underline cursor-pointer">Copy</button>
                    <span className="text-border">|</span>
                    <button onClick={handlePrint} className="hover:underline cursor-pointer">Print</button>
                    <span className="text-border">|</span>
                    <button onClick={() => handleDownload(reportDetails || selectedReport)} className="hover:underline cursor-pointer">Download</button>
                  </div>
                </div>
              </header>

              {/* TWO COLUMN NEWSPAPER LAYOUT */}
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
                  
                  {/* Left Column (Stats/Index/Archive Info combined) */}
                  <aside className="hidden lg:block space-y-6 shrink-0 select-none pr-4 border-r border-foreground/10">
                    <div className="p-4 border border-foreground/15 bg-muted/20 rounded-xl">
                      <h4 className="font-serif font-bold italic text-base border-b border-foreground mb-3 pb-1">Intelligence Archive</h4>
                      <p className="font-serif italic text-xs leading-relaxed text-muted-foreground mb-3">
                        Compiled deep-dives into the shifts, trends, and architectural evolution of the global developer ecosystem.
                      </p>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-bold">
                        <Activity className="h-3.5 w-3.5 text-primary animate-pulse" /> Verified Report
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-serif font-bold text-xs uppercase tracking-widest border-b border-foreground pb-1">Live Stats</h4>
                      <div className="space-y-2.5 font-mono text-[10px]">
                        <div className="flex justify-between items-end border-b border-foreground/10 pb-1">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Active Repos</span>
                          <span className="text-sm font-bold font-serif italic">1,402</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-foreground/10 pb-1">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Sentiment</span>
                          <span className="text-sm font-bold font-serif italic text-primary uppercase">Bullish</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-foreground pb-1">Section Index</h4>
                      <ul className="font-mono text-[9px] space-y-1.5 uppercase">
                        <li><span className="text-primary font-bold">A1:</span> Executive Summary</li>
                        <li><span className="text-primary font-bold">B2:</span> Top Tech Stories</li>
                        <li><span className="text-primary font-bold">C3:</span> Open-Source Radar</li>
                        <li><span className="text-primary font-bold">D4:</span> Emerging Glossary</li>
                      </ul>
                    </div>
                    
                    <div className="pt-4 border-t border-foreground/15">
                      <p className="font-serif text-[11px] italic text-muted-foreground leading-normal">
                        "The software journal of record for the enlightened engineer."
                      </p>
                    </div>
                  </aside>

                  {/* Right/Middle Column (Report Content - stretched) */}
                  <section className="min-w-0">
                    {renderNewspaperMarkdown(reportDetails?.content || selectedReport.content)}
                  </section>

                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground print:hidden">
            <Sparkles className="h-10 w-10 text-primary mb-2 animate-pulse" />
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
