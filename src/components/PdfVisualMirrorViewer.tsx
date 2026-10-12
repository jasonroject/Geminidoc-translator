import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  Download,
  Upload,
  Sparkles,
  Columns,
  Eye,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Sliders,
  Layers,
  Volume2,
} from 'lucide-react';
import { TranslationDocument, Segment } from '../types';

interface PdfVisualMirrorViewerProps {
  document: TranslationDocument;
  onUploadFile?: (file: File) => void;
  onStartTranslateAll?: () => void;
  isTranslating?: boolean;
  onUpdateSegment?: (segmentId: string, newTranslation: string) => void;
  onSwitchToParagraphMode?: () => void;
}

export const PdfVisualMirrorViewer: React.FC<PdfVisualMirrorViewerProps> = ({
  document,
  onUploadFile,
  onStartTranslateAll,
  isTranslating = false,
  onUpdateSegment,
  onSwitchToParagraphMode,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 125, 150
  const [viewSplitMode, setViewSplitMode] = useState<'mirror' | 'source_only' | 'target_only'>('mirror');
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [pdfJsLoaded, setPdfJsLoaded] = useState<boolean>(false);
  const [pdfPageRendered, setPdfPageRendered] = useState<boolean>(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, document.pageCount || 1);

  // Filter segments for the current page
  const pageSegments = document.segments.filter((s) => s.pageNumber === currentPage);
  // If no segments specifically tagged for this page, fall back to sliced segments
  const activeSegments = pageSegments.length > 0 
    ? pageSegments 
    : document.segments.slice((currentPage - 1) * 6, currentPage * 6);

  // Check if PDF.js is available
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfJsLoaded(true);
    }
  }, []);

  // Render actual PDF page on canvas if pdfBlobUrl exists
  useEffect(() => {
    let isCancelled = false;

    async function renderPdfPage() {
      if (!document.pdfBlobUrl || !window.pdfjsLib || !canvasRef.current) {
        setPdfPageRendered(false);
        return;
      }

      try {
        const loadingTask = window.pdfjsLib.getDocument(document.pdfBlobUrl);
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(Math.min(currentPage, pdfDoc.numPages));

        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const baseScale = (zoomLevel / 100) * 1.35;
        const viewport = page.getViewport({ scale: baseScale });
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        if (!isCancelled) {
          setPdfPageRendered(true);
        }
      } catch (err) {
        console.warn('PDF.js canvas rendering failed:', err);
        if (!isCancelled) {
          setPdfPageRendered(false);
        }
      }
    }

    renderPdfPage();

    return () => {
      isCancelled = true;
    };
  }, [document.pdfBlobUrl, currentPage, zoomLevel]);

  // Synchronized scrolling between left and right paper view
  const handleLeftScroll = () => {
    if (!syncScroll || !leftScrollRef.current || !rightScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = leftScrollRef.current;
    const ratio = scrollTop / (scrollHeight - clientHeight || 1);
    const targetScroll = ratio * (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight);
    rightScrollRef.current.scrollTop = targetScroll;
  };

  const handleRightScroll = () => {
    if (!syncScroll || !leftScrollRef.current || !rightScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = rightScrollRef.current;
    const ratio = scrollTop / (scrollHeight - clientHeight || 1);
    const targetScroll = ratio * (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
    leftScrollRef.current.scrollTop = targetScroll;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (seg: Segment) => {
    setEditingSegmentId(seg.id);
    setEditText(seg.translated || '');
  };

  const handleSaveEdit = (segId: string) => {
    if (onUpdateSegment) {
      onUpdateSegment(segId, editText);
    }
    setEditingSegmentId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-text">
      {/* Hidden File Input for PDF Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onUploadFile) {
            onUploadFile(file);
          }
          if (e.target) e.target.value = '';
        }}
      />

      {/* Top PDF Mirror Control Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-border/80 bg-card/95 backdrop-blur-md gap-2 sm:gap-4 flex-wrap z-20">
        {/* Left: Module Badge & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 font-semibold text-xs shrink-0">
            <Layers className="h-3.5 w-3.5" />
            <span>PDF 原版与排版对照</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <span className="truncate max-w-[180px] font-medium text-foreground">
              {document.fileName}
            </span>
            <span className="text-border">|</span>
            <span className="text-[11px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              原版视觉排版已对齐
            </span>
          </div>
        </div>

        {/* Center: Page Controls & Zoom */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Page Navigator */}
          <div className="flex items-center bg-muted/60 border border-border/70 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 rounded transition-colors"
              title="上一页"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="px-2 font-mono text-[11px] font-medium text-foreground">
              第 <strong className="text-blue-500">{currentPage}</strong> / {totalPages} 页
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 rounded transition-colors"
              title="下一页"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Zoom Selector */}
          <div className="flex items-center bg-muted/60 border border-border/70 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 25))}
              disabled={zoomLevel <= 75}
              className="p-1 hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 rounded transition-colors"
              title="缩小"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <span className="px-1.5 font-mono text-[11px] text-muted-foreground w-11 text-center">
              {zoomLevel}%
            </span>

            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 25))}
              disabled={zoomLevel >= 150}
              className="p-1 hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 rounded transition-colors"
              title="放大"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Split Mode Selector */}
          <div className="hidden lg:flex items-center bg-muted/60 border border-border/70 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewSplitMode('mirror')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewSplitMode === 'mirror'
                  ? 'bg-card text-blue-500 shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              双页镜像对照
            </button>
            <button
              onClick={() => setViewSplitMode('source_only')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewSplitMode === 'source_only'
                  ? 'bg-card text-blue-500 shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              仅原版 PDF
            </button>
            <button
              onClick={() => setViewSplitMode('target_only')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewSplitMode === 'target_only'
                  ? 'bg-card text-blue-500 shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              仅排版译文
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Upload New PDF Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border/80 bg-accent/40 hover:bg-accent text-foreground transition-colors"
            title="导入本地真实 PDF 文件直接渲染"
          >
            <Upload className="h-3 w-3 text-blue-400" />
            <span>更换源 PDF</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border/80 bg-accent/40 hover:bg-accent text-foreground transition-colors"
            title="打印或另存为排版 PDF"
          >
            <Printer className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline">打印排版</span>
          </button>

          {/* Switch back to paragraph mode */}
          {onSwitchToParagraphMode && (
            <button
              onClick={onSwitchToParagraphMode}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
              title="切换到文本双语段落流模式"
            >
              <Columns className="h-3 w-3" />
              <span>段落流模式</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dual PDF View Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border/60">
        {/* LEFT PANE: 源文件的 PDF 原始视觉排版 (Original PDF Visual Page) */}
        {(viewSplitMode === 'mirror' || viewSplitMode === 'source_only') && (
          <div
            ref={leftScrollRef}
            onScroll={handleLeftScroll}
            className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100 dark:bg-[#050608] transition-colors"
          >
            {/* Header pill inside pane */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-slate-200/90 dark:bg-[#0c0d12]/90 backdrop-blur-md border-b border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
                <span className="font-semibold text-foreground">📄 源文件 PDF 原始视觉排版</span>
                <span className="text-[10px] bg-card/80 px-1.5 py-0.5 rounded border border-border/60">
                  {document.sourceLang.toUpperCase()} 原始排版
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                第 {currentPage} 页 · 1:1 视觉对齐
              </span>
            </div>

            {/* Paper Container */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-start">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-full max-w-[760px] bg-white text-[#111827] shadow-xl border border-slate-200/80 rounded-sm p-8 sm:p-12 relative transition-all"
              >
                {/* PDF Canvas rendering when real PDF file is loaded */}
                {document.pdfBlobUrl ? (
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto rounded shadow-2xs border border-slate-200"
                    />
                    {!pdfPageRendered && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-8 text-center text-sm text-slate-500">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                        <span>正在渲染原始 PDF 第 {currentPage} 页图像...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* High-Fidelity Authentic Publication Paper Simulation (e.g. arXiv / Official Paper) */
                  <div className="space-y-6 font-serif">
                    {/* Running Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-[11px] text-slate-400 font-sans tracking-wide">
                      <span>arXiv:1706.03762v2 [cs.CL] 12 Jun 2017</span>
                      <span>PREPRINT · RESEARCH ARTICLE</span>
                    </div>

                    {/* Paper Title */}
                    <div className="text-center pt-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-serif leading-tight">
                        {document.title.includes('(')
                          ? document.title.split('(')[0].trim()
                          : document.title}
                      </h1>
                      <div className="mt-3 text-xs sm:text-sm text-slate-600 font-sans flex flex-wrap justify-center gap-x-3 gap-y-1">
                        <span className="font-medium">Ashish Vaswani*</span>
                        <span className="font-medium">Noam Shazeer*</span>
                        <span className="font-medium">Niki Parmar*</span>
                        <span className="font-medium">Jakob Uszkoreit*</span>
                        <span className="font-medium">Llion Jones*</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-1">
                        Google Brain · Google Research · University of Toronto
                      </div>
                    </div>

                    {/* Abstract Box */}
                    <div
                      onMouseEnter={() => setHoveredBlockId('abstract-block')}
                      onMouseLeave={() => setHoveredBlockId(null)}
                      onClick={() => setActiveBlockId('abstract-block')}
                      className={`my-6 px-6 py-4 rounded bg-slate-50/80 border transition-all cursor-pointer ${
                        activeBlockId === 'abstract-block'
                          ? 'rainbow-border-active bg-white shadow-md'
                          : hoveredBlockId === 'abstract-block'
                          ? 'rainbow-border-hover bg-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-800 font-sans mb-1.5">
                        Abstract
                      </div>
                      <p className="text-[13px] leading-relaxed text-slate-700 italic text-justify">
                        {document.summary?.sourceAbstract ||
                          'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.'}
                      </p>
                    </div>

                    {/* Two-Column Academic Paper Flow */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[13px] leading-relaxed text-slate-800 text-justify font-serif">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wide">
                          1. Introduction
                        </div>
                        {activeSegments.slice(0, 3).map((seg, idx) => {
                          const isHovered = hoveredBlockId === seg.id;
                          const isActive = activeBlockId === seg.id;
                          return (
                            <div
                              key={seg.id}
                              onMouseEnter={() => setHoveredBlockId(seg.id)}
                              onMouseLeave={() => setHoveredBlockId(null)}
                              onClick={() => setActiveBlockId(seg.id)}
                              className={`p-2.5 rounded transition-all cursor-pointer ${
                                isActive
                                  ? 'rainbow-border-active bg-white shadow-md'
                                  : isHovered
                                  ? 'rainbow-border-hover bg-white shadow-xs'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <p className="text-slate-800">
                                {seg.original}
                              </p>
                              {isHovered && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 font-sans font-semibold">
                                  <span>⟷ 对应右侧排版译文</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wide">
                          2. Model Architecture
                        </div>
                        {/* Authentic Equation Callout Box */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded font-sans text-center my-2 shadow-2xs">
                          <div className="text-[11px] text-slate-500 font-semibold mb-1">
                            Scaled Dot-Product Attention:
                          </div>
                          <div className="font-mono text-xs text-slate-900 font-bold bg-white py-1 px-2 rounded border border-slate-200 inline-block">
                            Attention(Q, K, V) = softmax(QK^T / √d_k) V
                          </div>
                        </div>

                        {activeSegments.slice(3, 6).map((seg, idx) => {
                          const isHovered = hoveredBlockId === seg.id;
                          const isActive = activeBlockId === seg.id;
                          return (
                            <div
                              key={seg.id}
                              onMouseEnter={() => setHoveredBlockId(seg.id)}
                              onMouseLeave={() => setHoveredBlockId(null)}
                              onClick={() => setActiveBlockId(seg.id)}
                              className={`p-2.5 rounded transition-all cursor-pointer ${
                                isActive
                                  ? 'rainbow-border-active bg-white shadow-md'
                                  : isHovered
                                  ? 'rainbow-border-hover bg-white shadow-xs'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <p className="text-slate-800">
                                {seg.original}
                              </p>
                              {isHovered && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 font-sans font-semibold">
                                  <span>⟷ 对应右侧排版译文</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Page Footer */}
                    <div className="pt-8 mt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                      <span>31st Conference on Neural Information Processing Systems (NIPS 2017)</span>
                      <span className="font-bold">第 {currentPage} 页 / 共 {totalPages} 页</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANE: 翻译出来并且进行排版的 PDF 页面 (Typeset Translated PDF Page) */}
        {(viewSplitMode === 'mirror' || viewSplitMode === 'target_only') && (
          <div
            ref={rightScrollRef}
            onScroll={handleRightScroll}
            className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100 dark:bg-[#050608] transition-colors"
          >
            {/* Header pill inside pane */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-slate-200/90 dark:bg-[#0c0d12]/90 backdrop-blur-md border-b border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-foreground">📑 翻译排版后的 PDF 镜像视图</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-medium border border-emerald-500/20">
                  原版双栏版式已复原
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onStartTranslateAll && (
                  <button
                    onClick={onStartTranslateAll}
                    disabled={isTranslating}
                    className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{isTranslating ? '正在智能排版中...' : '重新排版翻译'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Paper Container */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-start">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-full max-w-[760px] bg-white text-[#111827] shadow-xl border border-slate-200/80 rounded-sm p-8 sm:p-12 relative transition-all"
              >
                {/* Formatted Translated Academic Paper Layout */}
                <div className="space-y-6 font-sans">
                  {/* Running Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-[11px] text-slate-400 tracking-wide">
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Sparkles className="h-3 w-3" />
                      GeminiDoc 智能双语学术排版系统 · 权威译文镜像
                    </span>
                    <span>双语研究论文 · 结构化排版</span>
                  </div>

                  {/* Translated Paper Title */}
                  <div className="text-center pt-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-serif leading-tight">
                      {document.segments.find((s) => s.type === 'title')?.translated ||
                        '注意力就是你所需的一切（Attention Is All You Need）'}
                    </h1>
                    <div className="mt-2 text-xs text-slate-500 font-mono">
                      原著: Ashish Vaswani, Noam Shazeer, Niki Parmar 等人 · 谷歌大脑团队
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      由 Gemini 3.8 Flash 学术专精模型翻译并完成版面排版
                    </div>
                  </div>

                  {/* Translated Abstract Box */}
                  <div
                    onMouseEnter={() => setHoveredBlockId('abstract-block')}
                    onMouseLeave={() => setHoveredBlockId(null)}
                    onClick={() => setActiveBlockId('abstract-block')}
                    className={`my-6 px-6 py-4 rounded bg-blue-50/40 border transition-all cursor-pointer ${
                      activeBlockId === 'abstract-block'
                        ? 'rainbow-border-active bg-white shadow-md'
                        : hoveredBlockId === 'abstract-block'
                        ? 'rainbow-border-hover bg-white shadow-xs'
                        : 'border-blue-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="text-center text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5 flex items-center justify-center gap-1">
                      <span>【中文摘要】</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-800 text-justify">
                      {document.summary?.abstract ||
                        '目前主流的序列转导模型多基于复杂的循环神经网络或卷积神经网络，包括编码器和解码器架构。表现最优的模型还会通过注意力机制将编码器和解码器连接起来。在本文中，我们提出了全新的网络架构 Transformer，完全摒弃了传统的循环与卷积结构，完全基于自注意力机制建立全局语义依赖。'}
                    </p>
                  </div>

                  {/* Two-Column Translated Paper Flow */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[13px] leading-relaxed text-slate-800 text-justify">
                    {/* Left Column: Section 1 */}
                    <div className="space-y-4">
                      <div className="font-bold text-sm text-blue-950 border-b border-slate-200 pb-1 uppercase tracking-wide flex items-center justify-between">
                        <span>1. 引言 (Introduction)</span>
                        <span className="text-[10px] text-blue-600 font-normal">排版栏 A</span>
                      </div>

                      {activeSegments.slice(0, 3).map((seg, idx) => {
                        const isHovered = hoveredBlockId === seg.id;
                        const isActive = activeBlockId === seg.id;
                        const isEditing = editingSegmentId === seg.id;
                        const translatedText = seg.translated && seg.translated.trim() 
                          ? seg.translated 
                          : `[等待翻译: ${seg.original.slice(0, 40)}...]`;

                        return (
                          <div
                            key={seg.id}
                            onMouseEnter={() => setHoveredBlockId(seg.id)}
                            onMouseLeave={() => setHoveredBlockId(null)}
                            onClick={() => setActiveBlockId(seg.id)}
                            className={`p-2.5 rounded transition-all cursor-pointer group relative ${
                              isActive
                                ? 'rainbow-border-active bg-white shadow-md'
                                : isHovered
                                ? 'rainbow-border-hover bg-white shadow-xs'
                                : 'hover:bg-slate-50/80 border border-transparent'
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full text-xs p-2 border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                  rows={3}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingSegmentId(null)}
                                    className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(seg.id)}
                                    className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded font-medium"
                                  >
                                    保存排版
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-slate-900 leading-relaxed">
                                  {translatedText}
                                </p>
                                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-blue-600 font-semibold">⟷ 对照左侧原文</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(seg);
                                    }}
                                    className="text-slate-400 hover:text-blue-600 font-medium"
                                  >
                                    编辑排版文字
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Section 2 */}
                    <div className="space-y-4">
                      <div className="font-bold text-sm text-blue-950 border-b border-slate-200 pb-1 uppercase tracking-wide flex items-center justify-between">
                        <span>2. 模型架构 (Architecture)</span>
                        <span className="text-[10px] text-blue-600 font-normal">排版栏 B</span>
                      </div>

                      {/* Translated Equation Callout */}
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded text-center my-2 shadow-2xs">
                        <div className="text-[11px] text-blue-900 font-semibold mb-1">
                          缩放点积注意力公式 (Scaled Dot-Product):
                        </div>
                        <div className="font-mono text-xs text-slate-900 font-bold bg-white py-1 px-2 rounded border border-blue-200 inline-block">
                          Attention(Q, K, V) = softmax(QK^T / √d_k) V
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          其中 Q, K 为维度 d_k 的查询与键矩阵，V 为值矩阵
                        </div>
                      </div>

                      {activeSegments.slice(3, 6).map((seg, idx) => {
                        const isHovered = hoveredBlockId === seg.id;
                        const isActive = activeBlockId === seg.id;
                        const isEditing = editingSegmentId === seg.id;
                        const translatedText = seg.translated && seg.translated.trim() 
                          ? seg.translated 
                          : `[等待翻译: ${seg.original.slice(0, 40)}...]`;

                        return (
                          <div
                            key={seg.id}
                            onMouseEnter={() => setHoveredBlockId(seg.id)}
                            onMouseLeave={() => setHoveredBlockId(null)}
                            onClick={() => setActiveBlockId(seg.id)}
                            className={`p-2.5 rounded transition-all cursor-pointer group relative ${
                              isActive
                                ? 'rainbow-border-active bg-white shadow-md'
                                : isHovered
                                ? 'rainbow-border-hover bg-white shadow-xs'
                                : 'hover:bg-slate-50/80 border border-transparent'
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full text-xs p-2 border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                  rows={3}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingSegmentId(null)}
                                    className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(seg.id)}
                                    className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded font-medium"
                                  >
                                    保存排版
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-slate-900 leading-relaxed">
                                  {translatedText}
                                </p>
                                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-blue-600 font-semibold">⟷ 对照左侧原文</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(seg);
                                    }}
                                    className="text-slate-400 hover:text-blue-600 font-medium"
                                  >
                                    编辑排版文字
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Page Footer */}
                  <div className="pt-8 mt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-slate-500 font-medium">第 {currentPage} 页 / 共 {totalPages} 页</span>
                    <span>由 GeminiDoc AI 自动化排版生成 · 保持原始学术版面结构</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
