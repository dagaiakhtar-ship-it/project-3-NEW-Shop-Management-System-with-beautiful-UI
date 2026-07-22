import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, BarChart3, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../database/db';
import showToast from '../../utils/toast';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIAssistantPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! I am your AI Business Assistant. I have analyzed your local store records. Ask me about your sales, profits, expenses, customer credit debts, or stock levels, and I'll help you optimize your business!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompilingData, setIsCompilingData] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  // Loaded database settings state
  const [aiEnabledSetting, setAiEnabledSetting] = useState(true);
  const [aiApiKeySetting, setAiApiKeySetting] = useState('');
  const [aiModelSetting, setAiModelSetting] = useState('gemini-3.5-flash');
  const [aiPersonaSetting, setAiPersonaSetting] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadAISettings = async () => {
    try {
      const enabled = await db.settings.get('ai_enabled').then(r => r?.value !== false);
      const key = await db.settings.get('ai_api_key').then(r => r?.value || '');
      const model = await db.settings.get('ai_model').then(r => r?.value || 'gemini-3.5-flash');
      const persona = await db.settings.get('ai_persona').then(r => r?.value || '');

      setAiEnabledSetting(enabled);
      setAiApiKeySetting(key);
      setAiModelSetting(model);
      setAiPersonaSetting(persona);
    } catch (err) {
      console.error('Failed to load AI settings inside AIAssistantPanel:', err);
    }
  };

  // Quick prompt suggestions
  const SUGGESTED_PROMPTS = [
    { label: 'Revenue & Profit Summary', text: 'Give me a brief summary of our total sales revenue and estimated profits based on recorded sales.' },
    { label: 'Low Stock Report', text: 'Which products are currently low on stock and need immediate reordering?' },
    { label: 'Debt & Credit Exposure', text: 'What is our total customer credit debt exposure? Highlight major debtors.' },
    { label: 'Expense Analysis', text: 'Analyze our operating expenses and suggest potential areas to save money.' }
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load metrics snapshot from IndexedDB
  const compileBusinessSnapshot = async () => {
    setIsCompilingData(true);
    try {
      const products = await db.products.toArray();
      const sales = await db.sales.toArray();
      const expenses = await db.expenses.toArray();
      const customers = await db.customers.toArray();
      const suppliers = await db.suppliers.toArray();

      // Calculations
      const lowStockProducts = products.filter(
        (p) => (p.currentStock ?? 0) <= (p.minimumStock ?? 5)
      ).map(p => ({ name: p.name, stock: p.currentStock, min: p.minimumStock, sku: p.sku }));

      const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.total || s.grandTotal || 0), 0);
      const totalPaidAmount = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      const salesCount = sales.length;

      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const expensesCount = expenses.length;

      const totalCreditOwed = customers.reduce((sum, c) => sum + (c.currentBalance || c.balance || 0), 0);
      const activeCustomersCount = customers.length;

      const snapshot = {
        timestamp: new Date().toISOString(),
        inventory: {
          totalProductsCount: products.length,
          lowStockCount: lowStockProducts.length,
          lowStockSample: lowStockProducts.slice(0, 5)
        },
        financials: {
          totalSalesCount: salesCount,
          salesRevenue: totalSalesRevenue,
          cashReceived: totalPaidAmount,
          creditOutstanding: totalSalesRevenue - totalPaidAmount,
          totalExpenses,
          expensesCount,
          netCashFlow: totalPaidAmount - totalExpenses
        },
        customers: {
          totalCustomersCount: activeCustomersCount,
          totalCreditDebts: totalCreditOwed
        },
        suppliers: {
          totalSuppliersCount: suppliers.length
        }
      };

      setMetrics(snapshot);
    } catch (err) {
      console.error('Failed to compile business snapshot:', err);
    } finally {
      setIsCompilingData(false);
    }
  };

  // Compile on open
  useEffect(() => {
    loadAISettings();
    if (isOpen) {
      compileBusinessSnapshot();
    }
  }, [isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Re-compile snapshot fresh
      await compileBusinessSnapshot();

      // Load fresh settings before sending request to pick up instant changes
      const enabled = await db.settings.get('ai_enabled').then(r => r?.value !== false);
      const key = await db.settings.get('ai_api_key').then(r => r?.value || '');
      const model = await db.settings.get('ai_model').then(r => r?.value || 'gemini-3.5-flash');
      const persona = await db.settings.get('ai_persona').then(r => r?.value || '');

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: metrics,
          history: messages.slice(-10), // Limit history to keep payload size optimal
          apiKey: key.trim() || undefined,
          model: model,
          persona: persona.trim() || undefined
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
      } else {
        throw new Error(data.error || 'Server error communicating with Gemini');
      }
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ **Service Interrupted:** ${err.message || 'The AI service is temporarily unavailable. Please make sure the Gemini API Key is configured in Settings.'}`
        }
      ]);
      showToast.error('AI assistant connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple formatter to parse basic Markdown (bold, lists) into clean React components
  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      
      // Handle list items
      const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      if (isListItem) {
        content = line.trim().substring(2);
      }

      // Handle bold text (**bold**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const renderedLine = parts.length > 0 ? parts : content;

      if (isListItem) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 mb-1 leading-relaxed text-xs">
            {renderedLine}
          </li>
        );
      }

      return (
        <p key={idx} className={`leading-relaxed text-xs ${line.trim() === '' ? 'h-3' : 'mb-2'}`}>
          {renderedLine}
        </p>
      );
    });
  };

  if (!aiEnabledSetting) return null;

  return (
    <>
      {/* Floating AI Bubble Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
        title="Open AI Business Assistant"
        id="ai-assistant-trigger"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black uppercase tracking-wider text-white border-2 border-white dark:border-slate-950">
          AI
        </span>
      </button>

      {/* Slide-out Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950 backdrop-blur-xs"
            />

            {/* Sliding Panel container */}
            <motion.div
              initial={{ translateX: '100%' }}
              animate={{ translateX: 0 }}
              exit={{ translateX: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950 border-l border-slate-100 dark:border-slate-850"
            >
              {/* Header */}
              <div className="flex h-16 items-center justify-between px-5 border-b border-slate-150/40 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white shadow-md">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                      Business Assistant
                      <span className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-[8px] uppercase tracking-wider">
                        Gemini AI
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      {isCompilingData ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />
                          <span>Compiling database snapshots...</span>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Grounded on local IndexedDB metrics</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Embedded Quick Diagnostics Summary */}
                {metrics && (
                  <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 p-3.5 space-y-2.5 text-left select-none">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
                      Live Data Snapshot Summary
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-100/50 dark:border-slate-800/40">
                        <span className="block text-[9px] font-semibold text-slate-400">Total Revenue</span>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          ${metrics.financials.salesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-100/50 dark:border-slate-800/40">
                        <span className="block text-[9px] font-semibold text-slate-400">Total Expenses</span>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200 text-red-500">
                          ${metrics.financials.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-100/50 dark:border-slate-800/40">
                        <span className="block text-[9px] font-semibold text-slate-400">Low Stock Triggers</span>
                        <span className={`block text-xs font-black ${metrics.inventory.lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
                          {metrics.inventory.lowStockCount} items
                        </span>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-100/50 dark:border-slate-800/40">
                        <span className="block text-[9px] font-semibold text-slate-400">Debts Outstanding</span>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          ${metrics.customers.totalCreditDebts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, index) => {
                  const isBot = msg.role === 'model';
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 text-left ${isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      {isBot && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 max-w-[85%] shadow-xs text-xs leading-relaxed ${
                          isBot
                            ? 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {formatText(msg.text)}
                      </div>

                      {!isBot && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* AI Processing Bubble */}
                {isLoading && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 animate-bounce">
                      <Sparkles className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 text-slate-400 px-4 py-3 rounded-2xl flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Chips Area */}
              <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-850 flex flex-wrap gap-2 text-left bg-slate-50/20 dark:bg-slate-900/10 shrink-0">
                {SUGGESTED_PROMPTS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSend(chip.text)}
                    className="px-2.5 py-1 rounded-lg border border-slate-150/60 dark:border-slate-800 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50/10 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:border-indigo-900 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-150/40 dark:border-slate-850 bg-white dark:bg-slate-950 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="relative flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/20"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask assistant about operations..."
                    disabled={isLoading}
                    className="w-full bg-transparent outline-none border-none py-1.5 text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistantPanel;
