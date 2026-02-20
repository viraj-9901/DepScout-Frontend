import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Github, Sun, Moon, Package, CheckCircle, AlertCircle, Sparkles, Trash2, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import React from 'react'
import { analyzeDependencies, type AnalysisResult } from './utils/analysisUtils'
import ReportView from './components/ReportView'

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload')
  const [dragActive, setDragActive] = useState(false)
  const [jsonContent, setJsonContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('Initializing...')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please upload a valid JSON file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (validateJson(content)) {
        setJsonContent(content)
        toast.success('package.json loaded successfully')
        setInputMode('paste')
      } else {
        toast.error('Invalid JSON content')
      }
    }
    reader.readAsText(file)
  }

  const validateJson = (content: string) => {
    try {
      JSON.parse(content)
      return true
    } catch {
      return false
    }
  }

  const loadSamplePackageJson = () => {
    const sample = {
      "name": "sample-project",
      "version": "1.0.0",
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "axios": "^1.6.0",
        "lodash": "^4.17.21",
        "moment": "^2.29.4",
        "express": "^4.18.2"
      },
      "devDependencies": {
        "typescript": "^5.0.0",
        "vite": "^5.0.0",
        "tailwindcss": "^3.4.0"
      }
    }
    setJsonContent(JSON.stringify(sample, null, 2))
    setInputMode('paste')
    toast.success('Sample package.json loaded')
  }

  const handleClear = () => {
    setJsonContent('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setAnalysisResult(null)
  }

  const analyzePackage = async () => {
    if (!jsonContent) return

    try {
      const parsed = JSON.parse(jsonContent)
      setIsAnalyzing(true)

      const steps = [
        'Parsing package.json...',
        'Checking registry...',
        'Scanning for vulnerabilities...',
        'Calculating health score...'
      ]

      for (const step of steps) {
        setAnalysisStep(step)
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      const result = await analyzeDependencies(parsed)
      console.log("result: ", result)
      setAnalysisResult(result)
      toast.success('Analysis complete!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please check your JSON or connection.';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setAnalysisResult(null)
    setJsonContent('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'} selection:bg-indigo-500/30 overflow-x-hidden font-sans`}>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: theme === 'dark' ? '#18181b' : '#fff',
          color: theme === 'dark' ? '#fff' : '#0f172a',
          border: theme === 'dark' ? '1px solid #27272a' : '1px solid #e2e8f0',
        }
      }} />

      {/* Background Gradients & Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${theme === 'dark' ? 'opacity-20' : 'opacity-[0.03]'}`}></div>

        {/* Grid - Only in Light Mode */}
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] ${theme === 'dark' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]`}></div>

        {/* Dark Mode Ambient Glows - Enhanced */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse transition-all duration-700 ${theme === 'dark' ? 'bg-indigo-500/20 opacity-100' : 'bg-indigo-500/5 opacity-50'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse transition-all duration-700 ${theme === 'dark' ? 'bg-purple-500/20 opacity-100' : 'bg-purple-500/5 opacity-50'}`} style={{ animationDelay: '2s' }} />

        {/* Extra Center Glow for Dark Mode */}
        <div className={`absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] rounded-full blur-[150px] pointer-events-none transition-opacity duration-500 ${theme === 'dark' ? 'bg-blue-500/10 opacity-100' : 'opacity-0'}`} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className={`fixed top-0 inset-x-0 h-16 border-b backdrop-blur-md flex items-center justify-between px-6 lg:px-12 z-50 transition-all duration-300 ${theme === 'dark'
          ? 'border-white/5 bg-zinc-950/50'
          : 'border-slate-200/60 bg-white/60 supports-[backdrop-filter]:bg-white/60'
          }`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border shadow-sm transition-colors duration-300 ${theme === 'dark'
              ? 'bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border-white/10 shadow-white/5'
              : 'bg-white border-slate-200 shadow-slate-200/50'
              }`}>
              <Package size={20} className="text-indigo-500" />
            </div>
            <span className={`font-bold text-lg tracking-tight bg-clip-text text-transparent ${theme === 'dark'
              ? 'bg-gradient-to-r from-zinc-100 to-zinc-400'
              : 'bg-gradient-to-r from-slate-900 to-slate-600'
              }`}>DepScout</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 border ${theme === 'dark'
                ? 'border-transparent hover:bg-white/10 text-zinc-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm'
                }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a
              href="https://github.com/viraj-9901/DepScout-Frontend"
              target="_blank"
              rel="noreferrer"
              className={`group flex items-center gap-2 text-sm font-medium transition-colors ${theme === 'dark'
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <Github size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Star on GitHub</span>
            </a>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
          {analysisResult ? (
            <ReportView result={analysisResult} theme={theme} onReset={resetAnalysis} packageJson={JSON.parse(jsonContent)} />
          ) : (
            <>
              <div className="text-center max-w-3xl mx-auto mb-20 space-y-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-colors cursor-default ${theme === 'dark'
                  ? 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:bg-zinc-900/80'
                  : 'bg-white/80 border-slate-200 text-slate-600 shadow-sm ring-1 ring-slate-200/50'
                  }`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>Designed for devs who care about quality</span>
                </div>

                <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight pb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                  {/* Optimize your <br /> */}
                  A simpler way to <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient bg-300%">inspect dependencies</span>
                </h1>

                <p className={`text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                  Insights your `package.json`. Scan for security risks, uncover outdated packages, and visualize your dependency tree in seconds.
                </p>
              </div>

              {/* Analyzer Interface */}
              <div className="max-w-4xl mx-auto">
                <div className="relative group">
                  <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl transition duration-1000 blur-xl ${theme === 'dark' ? 'opacity-20 group-hover:opacity-30' : 'opacity-30 group-hover:opacity-50'
                    }`}></div>
                  <div className={`relative backdrop-blur-xl rounded-2xl border p-1 shadow-2xl transition-all duration-300 ${theme === 'dark'
                    ? 'bg-zinc-900/80 border-white/10 shadow-black/50 ring-1 ring-white/5'
                    : 'bg-white/80 border-slate-200 shadow-indigo-500/10 ring-1 ring-white/60'
                    }`}>

                    {/* Window Controls & Toggle */}
                    <div className={`h-14 border-b flex items-center justify-between px-4 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                      </div>

                      {/* Mode Toggle */}
                      <div className={`flex items-center justify-center p-1 rounded-lg border ${theme === 'dark' ? 'bg-zinc-800/50 border-white/5' : 'bg-slate-100/50 border-slate-200'
                        }`}>
                        <button
                          onClick={() => setInputMode('upload')}
                          className={`
                            flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                            ${inputMode === 'upload'
                              ? (theme === 'dark' ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-200')
                              : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')}
                          `}
                        >
                          <Upload size={14} />
                          Upload
                        </button>
                        <button
                          onClick={() => setInputMode('paste')}
                          className={`
                            flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                            ${inputMode === 'paste'
                              ? (theme === 'dark' ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-200')
                              : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')}
                          `}
                        >
                          <FileText size={14} />
                          Paste
                        </button>
                      </div>

                      <div className="w-16" /> {/* Spacer for balance */}
                    </div>

                    <div className="p-6 md:p-8">
                      {inputMode === 'upload' ? (
                        <div
                          className={`relative h-80 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${dragActive
                            ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]'
                            : (theme === 'dark' ? 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50')
                            }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl transition-transform duration-300 group-hover:scale-110 ${theme === 'dark' ? 'bg-zinc-800 shadow-black/20' : 'bg-white shadow-slate-200 border border-slate-100'
                            }`}>
                            <Upload className={theme === 'dark' ? 'text-zinc-400' : 'text-indigo-500'} size={32} />
                          </div>
                          <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}`}>
                            Upload package.json
                          </h3>
                          <p className={`text-sm mb-6 max-w-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                            Drag and drop your file here, or click to browse files from your computer
                          </p>
                          <button className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${theme === 'dark'
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow-md'
                            }`}>
                            Choose File
                          </button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="h-80 relative group/editor">
                          <div className={`absolute inset-0 rounded-xl border transition-all overflow-hidden ${theme === 'dark'
                            ? 'bg-zinc-950 border-zinc-700/50 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50'
                            : 'bg-slate-50/50 border-slate-200 focus-within:border-indigo-500/30 focus-within:ring-1 focus-within:ring-indigo-500/30 focus-within:bg-white'
                            }`}>
                            <textarea
                              value={jsonContent}
                              onChange={(e) => setJsonContent(e.target.value)}
                              placeholder="Paste your package.json content here..."
                              className={`w-full h-full bg-transparent text-sm font-mono p-4 resize-none focus:outline-none ${theme === 'dark'
                                ? 'text-zinc-300 placeholder:text-zinc-700'
                                : 'text-slate-700 placeholder:text-slate-400'
                                }`}
                              spellCheck={false}
                            />

                            {/* Validation Indicator */}
                            {jsonContent && (
                              <div className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 backdrop-blur-md ${validateJson(jsonContent)
                                ? (theme === 'dark' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-700')
                                : (theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
                                }`}>
                                {validateJson(jsonContent) ? (
                                  <>
                                    <CheckCircle size={12} />
                                    Valid JSON
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle size={12} />
                                    Invalid JSON
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={loadSamplePackageJson}
                            className={`text-sm font-medium transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-indigo-600'
                              }`}
                          >
                            <Sparkles size={16} />
                            Try with sample data
                          </button>

                          {jsonContent && (
                            <button
                              onClick={handleClear}
                              className="text-sm font-medium text-red-500/60 hover:text-red-500 transition-colors flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Clear
                            </button>
                          )}
                        </div>

                        <button
                          onClick={analyzePackage}
                          disabled={isAnalyzing || !jsonContent}
                          className={`
                            relative px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300
                            flex items-center gap-2 overflow-hidden
                            ${!jsonContent
                              ? (theme === 'dark' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5'
                            }
                          `}
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{analysisStep}</span>
                            </>
                          ) : (
                            <>
                              Run Analysis
                              <ArrowRight size={16} />
                            </>
                          )}

                          {/* Shimmer Effect when analyzing */}
                          {isAnalyzing && (
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Structural Progress Bar (Bottom of Content) */}
                    {isAnalyzing && (
                      <div className={`h-1.5 overflow-hidden rounded-b-xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[indeterminate_1.5s_infinite_linear] w-[30%]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mt-24">
                {[
                  {
                    icon: Zap,
                    title: 'Fast Analysis',
                    desc: 'Scans your project dependencies locally without sending data anywhere.'
                  },
                  {
                    icon: Shield,
                    title: 'Security First',
                    desc: 'Identify vulnerabilities and security risks in your dependency tree.'
                  },
                  {
                    icon: BarChart3,
                    title: 'Deep Insights',
                    desc: 'Visualize your project structure and spot duplicate packages easily.'
                  }
                ].map((feature, i) => (
                  <div key={i} className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark'
                    ? 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50'
                    : 'bg-white border-slate-200 hover:border-indigo-200/50 hover:shadow-lg hover:shadow-indigo-500/5'
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                      <feature.icon size={20} />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'
                      }`}>{feature.title}</h3>
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                      }`}>{feature.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        <footer className={`border-t py-8 text-center text-sm font-medium ${theme === 'dark' ? 'border-white/5 text-zinc-600' : 'border-slate-200 text-slate-400'
          }`}>
          <p>© 2026 DepScout. Open source and free forever.</p>
        </footer>
      </div>
    </div>
  )
}

export default App
