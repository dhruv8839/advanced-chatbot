"use client"

import React, { useState, useRef, useEffect } from "react"
import { 
  Send, Bot, User, Loader2, Trash2, Settings, 
  Menu, X, BookOpen, Code, FileText, Briefcase, 
  MessageSquare, UploadCloud, BarChart3, Info, 
  ThumbsUp, ThumbsDown, Copy, RefreshCw, Zap
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Message {
  role: "user" | "bot"
  content: string
  id: string
  feedback?: "up" | "down" | null
}

const MODES = [
  { id: "general", name: "General Chat", icon: MessageSquare, color: "text-blue-400" },
  { id: "study", name: "Study Assistant", icon: BookOpen, color: "text-emerald-400" },
  { id: "coding", name: "Coding Assistant", icon: Code, color: "text-purple-400" },
  { id: "document", name: "Document Assistant", icon: FileText, color: "text-amber-400" },
  { id: "career", name: "Career & Resume", icon: Briefcase, color: "text-rose-400" },
  { id: "business", name: "Business Assistant", icon: BarChart3, color: "text-cyan-400" }
]

const SUGGESTED_PROMPTS = [
  "Explain quantum computing in simple terms",
  "Write a React component for a dashboard",
  "Generate 5 Viva questions on Data Structures",
  "Summarize this concept in Hinglish",
]

export default function IntelliBotApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "I am IntelliBot AI, an advanced chatbot developed by Dhruv Ladwa as a smart AI assistant project. I can help with study notes, coding, documents, summaries, and general questions.",
      id: "initial",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeMode, setActiveMode] = useState(MODES[0])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeModal, setActiveModal] = useState<"settings" | "analytics" | "about" | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
    if (e) e.preventDefault()
    const textToSubmit = promptText || input
    if (!textToSubmit.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: textToSubmit,
      id: Date.now().toString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const botMessageId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { role: "bot", content: "", id: botMessageId }])

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSubmit, 
          history: messages,
          mode: activeMode.id 
        }),
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.replace("data: ", "").trim()
            if (content === "[DONE]") break
            if (content.startsWith("[ERROR]")) {
               accumulatedContent += `\nError: ${content.replace("[ERROR]: ", "")}`
            } else {
               accumulatedContent += content
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId ? { ...msg, content: accumulatedContent } : msg
              )
            )
          }
        }
      }
    } catch (error) {
      console.error("Error fetching chat:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: "Error: Connection to IntelliBot API failed." } : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Simulate file upload logic for UI purposes
      setMessages(prev => [...prev, {
        role: "bot",
        content: `Uploaded document: **${file.name}**. I've analyzed the content. What would you like to know about it?`,
        id: Date.now().toString()
      }])
      setActiveMode(MODES.find(m => m.id === "document") || MODES[0])
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      
      {/* Modals */}
      <AnimatePresence>
        {activeModal === "about" && (
          <Modal title="About IntelliBot AI" onClose={() => setActiveModal(null)}>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <strong>IntelliBot AI</strong> is an advanced AI chatbot project designed to provide smart assistance for students and professionals.
              </p>
              <p>
                Developed by <strong>Dhruv Ladwa</strong>, it supports multiple conversation modes, document-based interaction, code explanation, study material generation, and personalized responses.
              </p>
              <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h3 className="font-semibold text-white mb-2">Tech Stack</h3>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  <li><span className="text-blue-400">Frontend:</span> Next.js / React</li>
                  <li><span className="text-green-400">Backend:</span> FastAPI (Python)</li>
                  <li><span className="text-purple-400">AI Integration:</span> Custom AI API</li>
                  <li><span className="text-yellow-400">Styling:</span> Tailwind CSS</li>
                </ul>
              </div>
            </div>
          </Modal>
        )}
        
        {activeModal === "analytics" && (
          <Modal title="Project Dashboard" onClose={() => setActiveModal(null)}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total Chats", value: "1,204" },
                { label: "Messages", value: "8,592" },
                { label: "Most Used Mode", value: "Study Assistant" },
                { label: "Docs Uploaded", value: "34" },
                { label: "Positive Feedback", value: "98%" },
                { label: "Avg Response Time", value: "1.2s" },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  <div className="text-xl font-bold text-white mt-1">{stat.value}</div>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {activeModal === "settings" && (
          <Modal title="User Preferences" onClose={() => setActiveModal(null)}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Language</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Hinglish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Response Style</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>Detailed & Comprehensive</option>
                  <option>Short & Concise</option>
                  <option>Viva/Interview Style</option>
                </select>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-[#1e293b] border-r border-slate-800 flex flex-col shrink-0 z-20 absolute lg:relative w-[300px]"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">IntelliBot AI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <button 
                onClick={() => {
                  setMessages([{ role: "bot", content: "I am IntelliBot AI. New chat started. How can I help you today?", id: Date.now().toString() }])
                  setInput("")
                }}
                className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-3 text-sm font-medium transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Modes</h3>
                <div className="space-y-1">
                  {MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setActiveMode(mode)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors",
                        activeMode.id === mode.id 
                          ? "bg-slate-800 text-white font-medium" 
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      )}
                    >
                      <mode.icon className={cn("w-4 h-4", mode.color)} />
                      {mode.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Project Menu</h3>
                <div className="space-y-1">
                  <button onClick={() => setActiveModal("analytics")} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
                    <BarChart3 className="w-4 h-4" /> Analytics Dashboard
                  </button>
                  <button onClick={() => setActiveModal("settings")} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
                    <Settings className="w-4 h-4" /> Preferences
                  </button>
                  <button onClick={() => setActiveModal("about")} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
                    <Info className="w-4 h-4" /> About Project
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#1e293b]">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                  DL
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Dhruv Ladwa</div>
                  <div className="text-xs text-slate-400">Developer</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen w-full relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
              <activeMode.icon className={cn("w-4 h-4", activeMode.color)} />
              <span className="text-sm font-medium text-slate-200">{activeMode.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => {
                setMessages([])
              }}
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700"
            >
              <UploadCloud className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Upload Doc</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 pb-32">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {messages.length === 1 && messages[0].id === "initial" && (
              <div className="py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-900/20 mb-6">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Welcome to IntelliBot AI</h1>
                <p className="text-slate-400 max-w-lg mx-auto mb-8">
                  Your advanced AI assistant designed by Dhruv Ladwa. Experience smart document analysis, coding help, and interactive study modes.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSubmit(undefined, prompt)}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-sm text-slate-300 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message, i) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 group",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md mt-1",
                    message.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-blue-600 to-purple-600"
                  )}>
                    {message.role === "user" ? <User className="w-5 h-5 text-slate-300" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  
                  <div className={cn(
                    "flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed",
                      message.role === "user" 
                        ? "bg-slate-800 text-white rounded-tr-sm" 
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm"
                    )}>
                      {message.content === "" && message.role === "bot" ? (
                        <div className="flex gap-1.5 py-1.5 px-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                        </div>
                      ) : message.role === "user" ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <div className="markdown-body text-slate-200">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code(props) {
                                const {children, className, node, ref, ...rest} = props
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                  <div className="relative group my-4">
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <button 
                                        onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                        className="bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded-md border border-slate-700 shadow-sm"
                                        title="Copy Code"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <SyntaxHighlighter
                                      {...rest}
                                      PreTag="div"
                                      children={String(children).replace(/\n$/, '')}
                                      language={match[1]}
                                      style={vscDarkPlus as any}
                                      className="rounded-xl shadow-lg border border-slate-700/50 !mt-0 !mb-0 text-[14px]"
                                    />
                                  </div>
                                ) : (
                                  <code {...rest} className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-700/50">
                                    {children}
                                  </code>
                                )
                              },
                              p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                              ul: ({children}) => <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal ml-5 mb-3 space-y-1">{children}</ol>,
                              li: ({children}) => <li>{children}</li>,
                              h1: ({children}) => <h1 className="text-2xl font-bold mb-3 mt-5 text-white">{children}</h1>,
                              h2: ({children}) => <h2 className="text-xl font-bold mb-3 mt-5 text-white">{children}</h2>,
                              h3: ({children}) => <h3 className="text-lg font-bold mb-2 mt-4 text-white">{children}</h3>,
                              a: ({children, href}) => <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{children}</a>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-400 my-3 bg-slate-800/30 py-2 rounded-r-lg">{children}</blockquote>,
                              strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                              table: ({children}) => <div className="overflow-x-auto mb-4"><table className="w-full text-left border-collapse">{children}</table></div>,
                              th: ({children}) => <th className="border-b border-slate-700 bg-slate-800/50 p-3 text-white font-semibold">{children}</th>,
                              td: ({children}) => <td className="border-b border-slate-700 p-3 text-slate-300">{children}</td>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    {/* Bot Actions */}
                    {message.role === "bot" && message.content && message.id !== "initial" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(message.content)} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800" title="Copy">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800" title="Helpful">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800" title="Not helpful">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        {i === messages.length - 1 && (
                          <button onClick={() => handleSubmit(undefined, messages[i-1].content)} className="p-1.5 text-slate-400 hover:text-blue-400 rounded-md hover:bg-slate-800" title="Regenerate">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent shrink-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative mt-8">
            <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-2xl shadow-xl focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-3 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Upload Document"
              >
                <UploadCloud className="w-5 h-5" />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask IntelliBot AI in ${activeMode.name}...`}
                className="w-full bg-transparent border-none py-4 pl-14 pr-14 text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
              />
              
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "absolute right-2 p-2.5 rounded-xl transition-all flex items-center justify-center",
                  !input.trim() || isLoading
                    ? "bg-slate-800 text-slate-500"
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-95"
                )}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-center mt-3 flex items-center justify-center gap-4">
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                IntelliBot AI by Dhruv Ladwa
              </span>
              <span className="text-slate-700 text-xs">•</span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                AI Project v2.0
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
