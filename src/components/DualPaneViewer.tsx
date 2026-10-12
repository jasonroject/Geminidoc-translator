import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Segment,
  GlossaryTerm,
  ViewerLayoutMode,
  TranslationDocument,
} from '../types';
import {
  Copy,
  Check,
  Edit3,
  Volume2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Eye,
  FileUp,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Gauge,
  Lightbulb,
  Info,
  Search,
  X,
} from 'lucide-react';
import { GeminiStarIcon, GeminiBrandBadge, ColoredFeatureIcon } from './GeminiIcon';

interface DualPaneViewerProps {
  document: TranslationDocument;
  viewerMode: ViewerLayoutMode;
  syncScroll: boolean;
  activeSegmentId: string | null;
  onSelectSegment: (id: string) => void;
  onUpdateSegment: (segmentId: string, newTranslation: string) => void;
  onSelectGlossaryTerm: (term: GlossaryTerm) => void;
  onTranslateSingleSegment: (segment: Segment) => void;
  onUploadFile: (file: File) => void;
  onOpenSummaryModal?: () => void;
  onRegenerateSummary?: () => Promise<void>;
  isGeneratingSummary?: boolean;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
}

export const DualPaneViewer: React.FC<DualPaneViewerProps> = ({
  document,
  viewerMode,
  syncScroll,
  activeSegmentId,
  onSelectSegment,
  onUpdateSegment,
  onSelectGlossaryTerm,
  onTranslateSingleSegment,
  onUploadFile,
  onOpenSummaryModal,
  onRegenerateSummary,
  isGeneratingSummary = false,
  isSearchOpen,
  onToggleSearch,
}) => {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const interlinearRef = useRef<HTMLDivElement>(null);

  // Synchronized scrolling management refs
  const isSyncingRef = useRef(false);
  const activeSourceRef = useRef<'left' | 'right' | null>(null);
  const sourceClearTimerRef = useRef<number | null>(null);

  const markActiveSource = (source: 'left' | 'right') => {
    activeSourceRef.current = source;
    if (sourceClearTimerRef.current) {
      window.clearTimeout(sourceClearTimerRef.current);
    }
    sourceClearTimerRef.current = window.setTimeout(() => {
      activeSourceRef.current = null;
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (sourceClearTimerRef.current) {
        window.clearTimeout(sourceClearTimerRef.current);
      }
    };
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredTerm, setHoveredTerm] = useState<{
    term: GlossaryTerm;
    x: number;
    y: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState<boolean>(true);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // In-document Full-Text Search states
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'source' | 'target'>('all');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const effectiveSearchOpen = isSearchOpen !== undefined ? isSearchOpen : internalSearchOpen;
  const toggleSearch = () => {
    if (onToggleSearch) {
      onToggleSearch();
    } else {
      setInternalSearchOpen((prev) => !prev);
    }
  };

  // Compute matching segment IDs based on query and search scope
  const matchedSegmentIds = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];

    const query = caseSensitive ? q : q.toLowerCase();
    const result: string[] = [];

    document.segments.forEach((seg) => {
      let isMatch = false;
      const srcText = caseSensitive ? seg.original : seg.original.toLowerCase();
      const targetText = caseSensitive ? (seg.translated || '') : (seg.translated || '').toLowerCase();

      if ((searchScope === 'all' || searchScope === 'source') && srcText.includes(query)) {
        isMatch = true;
      }
      if ((searchScope === 'all' || searchScope === 'target') && targetText.includes(query)) {
        isMatch = true;
      }

      if (isMatch) {
        result.push(seg.id);
      }
    });

    return result;
  }, [document.segments, searchQuery, searchScope, caseSensitive]);

  // Adjust match index when matches change
  useEffect(() => {
    if (matchedSegmentIds.length > 0) {
      if (currentMatchIndex >= matchedSegmentIds.length) {
        setCurrentMatchIndex(0);
      }
    } else {
      setCurrentMatchIndex(0);
    }
  }, [matchedSegmentIds]);

  // Scroll to matched segment with sync suppression
  const scrollToMatchedSegment = (segId: string) => {
    onSelectSegment(segId);
    isSyncingRef.current = true;
    setTimeout(() => {
      const srcTarget = window.document.getElementById(`seg-item-src-${segId}`);
      const transTarget = window.document.getElementById(`seg-item-trans-${segId}`);
      const interTarget = window.document.getElementById(`seg-item-inter-${segId}`);

      if (viewerMode === 'side_by_side') {
        if (srcTarget) srcTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (transTarget) transTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const target = interTarget || srcTarget || transTarget;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 400);
    }, 50);
  };

  const handleNextMatch = () => {
    if (matchedSegmentIds.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchedSegmentIds.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatchedSegment(matchedSegmentIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchedSegmentIds.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchedSegmentIds.length) % matchedSegmentIds.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatchedSegment(matchedSegmentIds[prevIdx]);
  };

  // Keyboard shortcut listener for Ctrl+F / Cmd+F and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (!effectiveSearchOpen) {
          if (onToggleSearch) onToggleSearch();
          else setInternalSearchOpen(true);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      }
      if (e.key === 'Escape' && effectiveSearchOpen) {
        if (onToggleSearch) onToggleSearch();
        else setInternalSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveSearchOpen, onToggleSearch]);

  // Auto focus input when search opened
  useEffect(() => {
    if (effectiveSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [effectiveSearchOpen]);

  // Calculate synchronized target scrollTop with segment-aware alignment
  const calculateAlignedScrollTop = (
    source: 'left' | 'right',
    sourceEl: HTMLDivElement,
    targetEl: HTMLDivElement
  ): number => {
    const maxSource = sourceEl.scrollHeight - sourceEl.clientHeight;
    const maxTarget = targetEl.scrollHeight - targetEl.clientHeight;

    if (maxSource <= 0 || maxTarget <= 0) return 0;

    // Boundary edge cases: top and bottom limits
    if (sourceEl.scrollTop <= 6) return 0;
    if (sourceEl.scrollTop >= maxSource - 6) return maxTarget;

    // Segment-aware semantic alignment:
    // Keeps corresponding paragraphs aligned side-by-side even if one language takes more vertical space
    const segments = document.segments;
    if (segments && segments.length > 0) {
      const srcPrefix = source === 'left' ? 'seg-item-src-' : 'seg-item-trans-';
      const tgtPrefix = source === 'left' ? 'seg-item-trans-' : 'seg-item-src-';
      const sourceContainerRect = sourceEl.getBoundingClientRect();
      const targetContainerRect = targetEl.getBoundingClientRect();

      // Read line anchor: 32px from the top of the container
      const anchorY = 32;

      for (let i = 0; i < segments.length; i++) {
        const segId = segments[i].id;
        const srcItem = window.document.getElementById(`${srcPrefix}${segId}`);
        if (!srcItem) continue;

        const srcRect = srcItem.getBoundingClientRect();
        const relativeTop = srcRect.top - sourceContainerRect.top;
        const relativeBottom = relativeTop + srcRect.height;

        // Check if this segment intersects the anchor line
        if (relativeTop <= anchorY && relativeBottom > anchorY) {
          const tgtItem = window.document.getElementById(`${tgtPrefix}${segId}`);
          if (!tgtItem) break;

          const tgtRect = tgtItem.getBoundingClientRect();
          // Progress inside this segment [0..1]
          const progress = Math.max(0, Math.min(1, (anchorY - relativeTop) / Math.max(1, srcRect.height)));

          // Target segment desired position relative to target container
          const desiredTargetRelTop = anchorY - progress * tgtRect.height;
          const currentTargetRelTop = tgtRect.top - targetContainerRect.top;
          const delta = currentTargetRelTop - desiredTargetRelTop;

          return Math.max(0, Math.min(maxTarget, Math.round(targetEl.scrollTop + delta)));
        }
      }
    }

    // High-performance fallback: proportional percentage
    const scrollPercentage = sourceEl.scrollTop / maxSource;
    return Math.round(scrollPercentage * maxTarget);
  };

  // Synchronized scrolling handler with feedback loop suppression
  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll || viewerMode !== 'side_by_side') return;

    // Guard against programmatic sync re-entry
    if (isSyncingRef.current) return;

    // Guard: if user is actively wheeling/dragging the opposite pane, ignore follower events
    if (activeSourceRef.current && activeSourceRef.current !== source) return;

    markActiveSource(source);

    const sourceEl = source === 'left' ? leftPaneRef.current : rightPaneRef.current;
    const targetEl = source === 'left' ? rightPaneRef.current : leftPaneRef.current;

    if (!sourceEl || !targetEl) return;

    const targetScrollTop = calculateAlignedScrollTop(source, sourceEl, targetEl);

    if (Math.abs(targetEl.scrollTop - targetScrollTop) > 1) {
      isSyncingRef.current = true;
      targetEl.scrollTop = targetScrollTop;
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakText = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'zh-CN' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startEditing = (seg: Segment) => {
    setEditingSegmentId(seg.id);
    setEditText(seg.translated || '');
  };

  const saveEdit = (segId: string) => {
    onUpdateSegment(segId, editText);
    setEditingSegmentId(null);
  };

  // Helper to render text with highlighted search keywords and glossary terms
  const renderHighlightedContent = (
    text: string,
    glossary: GlossaryTerm[],
    isSource: boolean,
    segmentId?: string
  ) => {
    if (!text) return '';

    const q = searchQuery.trim();
    const shouldSearchThisText =
      q.length > 0 &&
      (searchScope === 'all' ||
        (searchScope === 'source' && isSource) ||
        (searchScope === 'target' && !isSource));

    const isCurrentActiveMatch =
      matchedSegmentIds.length > 0 &&
      segmentId !== undefined &&
      matchedSegmentIds[currentMatchIndex] === segmentId;

    // Helper to render glossary spans on non-search chunks
    const renderGlossarySubText = (subText: string, keyPrefix: string) => {
      if (!glossary || glossary.length === 0) return subText;

      const termMap = new Map<string, GlossaryTerm>();
      glossary.forEach((g) => {
        const matchKey = isSource ? g.term.toLowerCase() : g.translation.toLowerCase();
        if (matchKey && matchKey.length > 1) {
          termMap.set(matchKey, g);
        }
      });

      const termKeys = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);
      if (termKeys.length === 0) return subText;

      const escaped = termKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
      const parts = subText.split(regex);

      return parts.map((part, index) => {
        const matchedTerm = termMap.get(part.toLowerCase());
        if (matchedTerm) {
          return (
            <span
              key={`${keyPrefix}-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectGlossaryTerm(matchedTerm);
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredTerm({
                  term: matchedTerm,
                  x: rect.left,
                  y: rect.bottom + 6,
                });
              }}
              onMouseLeave={() => setHoveredTerm(null)}
              className="cursor-pointer font-medium text-blue-400 bg-blue-500/15 hover:bg-blue-500/25 border-b border-blue-400/40 rounded px-1 mx-0.5 transition-colors"
            >
              {part}
            </span>
          );
        }
        return part;
      });
    };

    // If active search query matches this field, split by search term first
    if (shouldSearchThisText) {
      const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(`(${escapedQuery})`, caseSensitive ? 'g' : 'gi');
      const searchParts = text.split(searchRegex);

      return searchParts.map((part, idx) => {
        const isMatch = caseSensitive ? part === q : part.toLowerCase() === q.toLowerCase();
        if (isMatch) {
          return (
            <mark
              key={`search-part-${idx}`}
              className={`rounded px-1 transition-all ${
                isCurrentActiveMatch
                  ? 'bg-amber-400 text-black shadow-sm ring-2 ring-amber-400 font-bold'
                  : 'bg-amber-400/35 text-amber-200 border-b-2 border-amber-400 font-semibold'
              }`}
            >
              {part}
            </mark>
          );
        }
        return renderGlossarySubText(part, `txt-${idx}`);
      });
    }

    return renderGlossarySubText(text, 'all');
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Group segments by page number
  const pageNumbers = Array.from(
    new Set(document.segments.map((s) => s.pageNumber || 1))
  ).sort((a, b) => a - b);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col h-full w-full overflow-hidden bg-background ${
        isDragOver ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/5' : ''
      }`}
    >
      {/* Drag & drop overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <FileUp className="h-12 w-12 text-blue-500 animate-bounce" />
          <p className="mt-3 text-lg font-semibold text-foreground">松开鼠标上传 PDF 或文档</p>
          <p className="text-sm text-muted-foreground">将自动提取文字并进入双语对照翻译工作流</p>
        </div>
      )}

      {/* Hover Glossary Card Popup */}
      {hoveredTerm && (
        <div
          style={{ top: hoveredTerm.y, left: Math.min(hoveredTerm.x, window.innerWidth - 300) }}
          className="fixed z-50 w-72 rounded-xl border border-border bg-card p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 pointer-events-none"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-blue-400 mb-1">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>重点专业术语</span>
            </span>
            {hoveredTerm.term.category && (
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400 font-normal leading-none">
                {hoveredTerm.term.category}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-foreground">
            {hoveredTerm.term.term}
          </div>
          <div className="text-xs font-medium text-emerald-400 mt-0.5">
            = {hoveredTerm.term.translation}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {hoveredTerm.term.explanation}
          </p>
          <div className="mt-2 text-[10px] text-muted-foreground/80 border-t border-border/50 pt-1.5 flex items-center justify-between">
            <span>点击查看完整词条或添加笔记</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Embedded AI Document Core Executive Summary Bar */}
      <div className="shrink-0 border-b border-border/80 bg-gradient-to-r from-card via-card/90 to-background/90 px-3.5 sm:px-6 py-2.5 transition-all">
        {document.summary ? (
          <div className="space-y-2">
            {/* Summary Top Line */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 border border-indigo-500/30 px-2.5 py-1 text-xs font-semibold text-indigo-400 shrink-0">
                  <GeminiStarIcon size={12} fill="#818CF8" />
                  <span>AI 核心摘要</span>
                </div>

                {/* One sentence TL;DR or abstract */}
                <div className="text-xs font-medium text-foreground truncate min-w-0 flex-1">
                  <span className="text-blue-400 font-bold mr-1">【要点速览】</span>
                  <span>{document.summary.oneSentenceVerdict || document.summary.abstract}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    const text = `【${document.title} 核心摘要】\n${document.summary?.abstract}\n\n关键要点:\n${document.summary?.keyTakeaways?.map((k, i) => `${i + 1}. ${k}`).join('\n')}`;
                    navigator.clipboard.writeText(text);
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 2000);
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title="复制核心摘要"
                >
                  {copiedSummary ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span className="hidden sm:inline">{copiedSummary ? '已复制' : '复制'}</span>
                </button>

                {onRegenerateSummary && (
                  <button
                    onClick={onRegenerateSummary}
                    disabled={isGeneratingSummary}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                    title="重新提炼摘要"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">重新提炼</span>
                  </button>
                )}

                {onOpenSummaryModal && (
                  <button
                    onClick={onOpenSummaryModal}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="打开全屏深度摘要分析"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="hidden sm:inline">深度分析</span>
                  </button>
                )}

                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title={isSummaryExpanded ? '收起摘要' : '展开摘要'}
                >
                  {isSummaryExpanded ? (
                    <>
                      <span className="text-[11px] hidden sm:inline">收起</span>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] hidden sm:inline">展开</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Detailed Summary Cards */}
            {isSummaryExpanded && (
              <div className="pt-2 border-t border-border/50 grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs animate-in fade-in duration-200">
                {/* Core Abstract & Audience */}
                <div className="lg:col-span-6 rounded-lg bg-card/70 border border-border/60 p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold text-blue-400">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>核心主旨与要点</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      预估阅读 ~{document.summary.readingTimeMinutes || 5}分钟 · 难度: {document.summary.difficulty || '专业级'}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    {document.summary.abstract}
                  </p>
                  {document.summary.sourceAbstract && (
                    <div className="text-[11px] text-muted-foreground/80 italic border-t border-border/40 pt-1">
                      <span className="not-italic font-semibold mr-1">原文核心:</span>
                      {document.summary.sourceAbstract}
                    </div>
                  )}
                </div>

                {/* Key Takeaways */}
                <div className="lg:col-span-6 rounded-lg bg-card/70 border border-border/60 p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold text-emerald-400">
                    <span>💡 核心关键事实 / 论证</span>
                    <span className="text-[10px] text-muted-foreground font-normal">分类: {document.summary.category || document.category}</span>
                  </div>
                  <div className="space-y-1">
                    {(document.summary.keyTakeaways || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-foreground/90 leading-tight">
                        <span className="text-emerald-400 font-bold shrink-0 text-[10px] mt-0.5">•</span>
                        <span className="line-clamp-2">{item}</span>
                      </div>
                    ))}
                  </div>

                  {document.summary.keywords && document.summary.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                      {document.summary.keywords.slice(0, 5).map((kw, i) => (
                        <span key={i} className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground leading-none">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Summary Banner - Prompt to generate */
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs py-0.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ColoredFeatureIcon color="gemini" size="sm">
                <Sparkles className="h-3 w-3" />
              </ColoredFeatureIcon>
              <span className="text-muted-foreground truncate">
                该文档尚未生成 AI 智能摘要。点击一键提炼核心论点与关键事实速览。
              </span>
            </div>

            {onRegenerateSummary && (
              <button
                onClick={onRegenerateSummary}
                disabled={isGeneratingSummary}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 shrink-0 active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, #1A73E8 0%, #4F46E5 35%, #9333EA 70%, #EC4899 100%)',
                }}
              >
                <GeminiStarIcon size={12} fill="#FFFFFF" className={isGeneratingSummary ? 'animate-spin' : ''} />
                <span>{isGeneratingSummary ? '正在提炼中...' : '一键生成核心摘要'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* In-Document Full-Text Search Toolbar */}
      {effectiveSearchOpen && (
        <div className="shrink-0 border-b border-border/80 bg-card/95 px-3.5 sm:px-6 py-2 backdrop-blur-md shadow-md flex flex-wrap items-center justify-between gap-2 z-30 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-2xl">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) handlePrevMatch();
                    else handleNextMatch();
                  } else if (e.key === 'Escape') {
                    toggleSearch();
                  }
                }}
                placeholder="搜索原译文关键词 (Enter 下一个)..."
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Scope Filter Pills */}
            <div className="hidden sm:flex rounded-lg border border-border bg-background/60 p-0.5 text-[11px] shrink-0">
              <button
                onClick={() => setSearchScope('all')}
                className={`rounded px-2 py-0.5 transition-colors ${
                  searchScope === 'all'
                    ? 'bg-blue-500/20 text-blue-400 font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSearchScope('source')}
                className={`rounded px-2 py-0.5 transition-colors ${
                  searchScope === 'source'
                    ? 'bg-blue-500/20 text-blue-400 font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                原文
              </button>
              <button
                onClick={() => setSearchScope('target')}
                className={`rounded px-2 py-0.5 transition-colors ${
                  searchScope === 'target'
                    ? 'bg-blue-500/20 text-blue-400 font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                译文
              </button>
            </div>

            {/* Case sensitive toggle */}
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={`rounded px-2 py-1 text-xs font-mono transition-colors shrink-0 ${
                caseSensitive
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold'
                  : 'text-muted-foreground hover:bg-muted border border-transparent'
              }`}
              title="区分大小写 (Case Sensitive)"
            >
              Aa
            </button>
          </div>

          {/* Navigation Controls and Match Count */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            {searchQuery.trim() && (
              <span className={`text-[11px] font-medium font-mono whitespace-nowrap ${
                matchedSegmentIds.length > 0 ? 'text-foreground' : 'text-amber-400'
              }`}>
                {matchedSegmentIds.length > 0
                  ? `${currentMatchIndex + 1}/${matchedSegmentIds.length}`
                  : '无匹配'}
              </span>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMatch}
                disabled={matchedSegmentIds.length === 0}
                className="rounded-md border border-border p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 transition-colors"
                title="定位至上一个匹配段落 (Shift + Enter)"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleNextMatch}
                disabled={matchedSegmentIds.length === 0}
                className="rounded-md border border-border p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 transition-colors"
                title="定位至下一个匹配段落 (Enter)"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={toggleSearch}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ml-1"
                title="关闭搜索栏 (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area based on viewerMode */}
      <div className="flex-1 overflow-hidden">
      {viewerMode === 'side_by_side' && (
        <div className="grid h-full grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left Column: Source Text */}
          <div
            ref={leftPaneRef}
            onScroll={() => handleScroll('left')}
            onMouseEnter={() => markActiveSource('left')}
            onWheel={() => markActiveSource('left')}
            onPointerDown={() => markActiveSource('left')}
            onTouchStart={() => markActiveSource('left')}
            className="h-full overflow-y-auto px-4 py-6 sm:px-8 bg-card/30 overscroll-contain"
          >
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    原
                  </span>
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">
                    原文文档 ({document.sourceLang})
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  共 {document.segments.length} 个语义段落
                </span>
              </div>

              {document.segments.map((segment, index) => {
                const isActive = activeSegmentId === segment.id;
                const isMatchedSeg = matchedSegmentIds.includes(segment.id);
                const isCurrentFocus =
                  matchedSegmentIds.length > 0 &&
                  matchedSegmentIds[currentMatchIndex] === segment.id;

                return (
                  <div
                    key={segment.id}
                    id={`seg-item-src-${segment.id}`}
                    data-segment-id={segment.id}
                    onClick={() => onSelectSegment(segment.id)}
                    className={`group relative rounded-xl p-4 transition-all duration-150 cursor-pointer ${
                      isCurrentFocus
                        ? 'bg-amber-500/15 ring-2 ring-amber-400 shadow-md shadow-amber-500/10'
                        : isActive
                        ? 'bg-blue-500/10 ring-1 ring-blue-500/40 shadow-sm'
                        : isMatchedSeg
                        ? 'bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'hover:bg-accent/40 bg-card/40 border border-border/40'
                    }`}
                  >
                    {/* Segment header pill */}
                    <div className="flex items-center justify-between gap-1.5 text-[11px] text-muted-foreground mb-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 font-mono flex-wrap min-w-0">
                        <span className="shrink-0">#{index + 1} · 第 {segment.pageNumber} 页</span>
                        {isMatchedSeg && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none shrink-0 ${
                            isCurrentFocus
                              ? 'bg-amber-400 text-black font-bold'
                              : 'bg-amber-500/20 text-amber-300 font-medium'
                          }`}>
                            匹配命中
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(segment.original, document.sourceLang);
                          }}
                          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="发音朗读"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(segment.original, `src-${segment.id}`);
                          }}
                          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="复制原文"
                        >
                          {copiedId === `src-${segment.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Segment content */}
                    <div
                      className={`text-sm leading-relaxed ${
                        segment.type === 'title'
                          ? 'text-lg font-bold text-foreground'
                          : segment.type === 'heading'
                          ? 'text-base font-semibold text-foreground'
                          : 'text-foreground/90'
                      }`}
                    >
                      {renderHighlightedContent(segment.original, document.glossary, true, segment.id)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Translated Text */}
          <div
            ref={rightPaneRef}
            onScroll={() => handleScroll('right')}
            onMouseEnter={() => markActiveSource('right')}
            onWheel={() => markActiveSource('right')}
            onPointerDown={() => markActiveSource('right')}
            onTouchStart={() => markActiveSource('right')}
            className="h-full overflow-y-auto px-4 py-6 sm:px-8 bg-card/60 overscroll-contain"
          >
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-xs font-bold text-blue-400">
                    译
                  </span>
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">
                    译文对照 ({document.targetLang})
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    已翻译 {document.segments.filter((s) => s.translated).length} / {document.segments.length}
                  </span>
                </div>
              </div>

              {document.segments.map((segment, index) => {
                const isActive = activeSegmentId === segment.id;
                const isEditing = editingSegmentId === segment.id;
                const hasTranslation = segment.translated && segment.translated.trim().length > 0;
                const isMatchedSeg = matchedSegmentIds.includes(segment.id);
                const isCurrentFocus =
                  matchedSegmentIds.length > 0 &&
                  matchedSegmentIds[currentMatchIndex] === segment.id;

                return (
                  <div
                    key={segment.id}
                    id={`seg-item-trans-${segment.id}`}
                    data-segment-id={segment.id}
                    onClick={() => onSelectSegment(segment.id)}
                    className={`group relative rounded-xl p-4 transition-all duration-150 cursor-pointer ${
                      isCurrentFocus
                        ? 'bg-amber-500/15 ring-2 ring-amber-400 shadow-md shadow-amber-500/10'
                        : isActive
                        ? 'bg-blue-500/10 ring-1 ring-blue-500/50 shadow-md shadow-blue-500/5'
                        : isMatchedSeg
                        ? 'bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'hover:bg-accent/40 bg-card border border-border/50'
                    }`}
                  >
                    {/* Segment header pill */}
                    <div className="flex items-center justify-between gap-1.5 text-[11px] text-muted-foreground mb-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 font-mono flex-wrap min-w-0">
                        <span className="shrink-0">#{index + 1}</span>
                        {isMatchedSeg && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none shrink-0 ${
                            isCurrentFocus
                              ? 'bg-amber-400 text-black font-bold'
                              : 'bg-amber-500/20 text-amber-300 font-medium'
                          }`}>
                            匹配命中
                          </span>
                        )}
                        {segment.userEdited && (
                          <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400 leading-none shrink-0">
                            已校对
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasTranslation && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(segment.translated, document.targetLang);
                              }}
                              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="朗读译文"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(segment.translated, `trans-${segment.id}`);
                              }}
                              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="复制译文"
                            >
                              {copiedId === `trans-${segment.id}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(segment);
                              }}
                              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="编辑校对译文"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {!hasTranslation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTranslateSingleSegment(segment);
                            }}
                            className="flex items-center gap-1 rounded bg-blue-600/90 px-2 py-0.5 text-[11px] text-white hover:bg-blue-600"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>立即翻译</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content or Edit Box */}
                    {isEditing ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-blue-500 bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingSegmentId(null)}
                            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => saveEdit(segment.id)}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                          >
                            保存修改
                          </button>
                        </div>
                      </div>
                    ) : hasTranslation ? (
                      <div
                        className={`text-sm leading-relaxed ${
                          segment.type === 'title'
                            ? 'text-lg font-bold text-foreground'
                            : segment.type === 'heading'
                            ? 'text-base font-semibold text-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {renderHighlightedContent(segment.translated, document.glossary, false, segment.id)}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-2 text-xs text-muted-foreground italic">
                        <span>此段落尚未完成翻译...</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTranslateSingleSegment(segment);
                          }}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 not-italic font-medium"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>一键翻译本段</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interlinear Mode: Alternating Paragraphs (段落交替上下对照) */}
      {viewerMode === 'interlinear' && (
        <div
          ref={interlinearRef}
          className="h-full overflow-y-auto px-4 py-8 sm:px-12 bg-background/50 overscroll-contain"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="border-b border-border/70 pb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                段落交替双语对照模式
              </h2>
              <span className="text-xs text-muted-foreground">
                原译文同段对齐呈现
              </span>
            </div>

            {document.segments.map((segment, index) => {
              const isActive = activeSegmentId === segment.id;
              const isMatchedSeg = matchedSegmentIds.includes(segment.id);
              const isCurrentFocus =
                matchedSegmentIds.length > 0 &&
                matchedSegmentIds[currentMatchIndex] === segment.id;

              return (
                <div
                  key={segment.id}
                  id={`seg-item-inter-${segment.id}`}
                  data-segment-id={segment.id}
                  onClick={() => onSelectSegment(segment.id)}
                  className={`rounded-xl border p-5 transition-all cursor-pointer ${
                    isCurrentFocus
                      ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400 shadow-md shadow-amber-500/10'
                      : isActive
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-md'
                      : isMatchedSeg
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-border/60 bg-card hover:border-border'
                  }`}
                >
                  <div className="text-[11px] font-mono text-muted-foreground mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>#{index + 1} · 第 {segment.pageNumber} 页</span>
                      {isMatchedSeg && (
                        <span className={`rounded px-1.5 text-[10px] ${
                          isCurrentFocus
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-amber-500/20 text-amber-300 font-medium'
                        }`}>
                          匹配命中
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(`${segment.original}\n\n${segment.translated}`, segment.id);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === segment.id ? '已复制' : '复制双语段落'}
                    </button>
                  </div>

                  {/* Original line */}
                  <div className="text-sm text-muted-foreground/90 pb-2 mb-2 border-b border-border/40 leading-relaxed">
                    <span className="text-xs font-semibold text-muted-foreground/60 mr-2 uppercase">
                      原文:
                    </span>
                    {renderHighlightedContent(segment.original, document.glossary, true, segment.id)}
                  </div>

                  {/* Translated line */}
                  <div className="text-sm font-medium text-foreground leading-relaxed">
                    <span className="text-xs font-semibold text-blue-400 mr-2 uppercase">
                      译文:
                    </span>
                    {segment.translated ? (
                      renderHighlightedContent(segment.translated, document.glossary, false, segment.id)
                    ) : (
                      <span className="text-muted-foreground italic">【未翻译】</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target Only Mode (纯译文阅读) */}
      {viewerMode === 'target_only' && (
        <div className="h-full overflow-y-auto px-4 py-8 sm:px-12 bg-background/50 overscroll-contain">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="border-b border-border/70 pb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                完整译文畅读模式 ({document.targetLang})
              </h2>
              <span className="text-xs text-muted-foreground">纯净沉浸式阅读</span>
            </div>

            {document.segments.map((segment) => (
              <div
                key={segment.id}
                id={`seg-item-target-${segment.id}`}
                data-segment-id={segment.id}
                className="text-foreground leading-relaxed"
              >
                {segment.type === 'title' ? (
                  <h1 className="text-2xl font-bold mb-4">{segment.translated || segment.original}</h1>
                ) : segment.type === 'heading' ? (
                  <h2 className="text-lg font-semibold mt-6 mb-2 text-blue-400">
                    {segment.translated || segment.original}
                  </h2>
                ) : (
                  <p className="text-sm leading-7 mb-3 text-foreground/90">
                    {renderHighlightedContent(segment.translated || segment.original, document.glossary, false, segment.id)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Only Mode (纯原文) */}
      {viewerMode === 'source_only' && (
        <div className="h-full overflow-y-auto px-4 py-8 sm:px-12 bg-background/50 overscroll-contain">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="border-b border-border/70 pb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                原始文档模式 ({document.sourceLang})
              </h2>
              <span className="text-xs text-muted-foreground">校对与原文对照参考</span>
            </div>

            {document.segments.map((segment) => (
              <div
                key={segment.id}
                id={`seg-item-source-${segment.id}`}
                data-segment-id={segment.id}
                className="text-foreground leading-relaxed"
              >
                {segment.type === 'title' ? (
                  <h1 className="text-2xl font-bold mb-4">{segment.original}</h1>
                ) : segment.type === 'heading' ? (
                  <h2 className="text-lg font-semibold mt-6 mb-2 text-foreground">
                    {segment.original}
                  </h2>
                ) : (
                  <p className="text-sm leading-7 mb-3 text-foreground/90">
                    {renderHighlightedContent(segment.original, document.glossary, true, segment.id)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
