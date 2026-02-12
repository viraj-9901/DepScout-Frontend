import React, { useRef, useState } from 'react';
import { Download, AlertCircle, Package, Zap, ArrowUpCircle, Loader2, Shield, ExternalLink } from 'lucide-react';
import type { AnalysisResult, SecurityResult } from '../utils/analysisUtils';
import { checkSecurityVulnerabilities } from '../utils/analysisUtils';
// import html2canvas from 'html2canvas';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface ReportViewProps {
    result: AnalysisResult;
    theme: 'dark' | 'light';
    onReset: () => void;
    packageJson: any;
}

const ReportView: React.FC<ReportViewProps> = ({ result, theme, onReset, packageJson }) => {
    console.log("result: ", result)
    const [visibleDepsCount, setVisibleDepsCount] = useState(10);
    const [visibleDevDepsCount, setVisibleDevDepsCount] = useState(10);
    const [isExporting, setIsExporting] = useState(false);
    const [visibleOutdatedCount, setVisibleOutdatedCount] = useState(15);
    const [isScanningSecurity, setIsScanningSecurity] = useState(false);
    const [securityResult, setSecurityResult] = useState<SecurityResult | null>(null);
    const [visibleVulnCount, setVisibleVulnCount] = useState(10);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleSecurityScan = async () => {
        if (isScanningSecurity) return;
        setIsScanningSecurity(true);
        try {
            const result = await checkSecurityVulnerabilities(packageJson);
            setSecurityResult(result);
            if (result.totalVulnerabilities === 0) {
                toast.success('No vulnerabilities found!');
            } else {
                toast.error(`Found ${result.totalVulnerabilities} vulnerabilities`);
            }
        } catch (error) {
            console.error('Security scan failed:', error);
            toast.error('Security scan failed');
        } finally {
            setIsScanningSecurity(false);
        }
    };

    const getSeverityClasses = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return theme === 'dark' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-700 border-red-200';
            case 'HIGH': return theme === 'dark' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-100 text-orange-700 border-orange-200';
            case 'MEDIUM': return theme === 'dark' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'LOW': return theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200';
            default: return theme === 'dark' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current || isExporting) return;
        setIsExporting(true);
        // Yield to the event loop so React can paint the loading state before the heavy work
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            // const canvas = await html2canvas(reportRef.current, {
            //     scale: 2,
            //     backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
            //     logging: false
            // });

            const canvas = await htmlToImage
                .toCanvas(reportRef.current, {
                    quality: 1,
                    pixelRatio: 2,
                    backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
                })

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = canvas.width / 4;
            const pdfHeight = canvas.height / 4;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('package-analysis-report.pdf');
            toast.success('Report downloaded successfully!');
        } catch (error) {
            console.error('PDF generation failed:', error);
            toast.error('Failed to generate PDF report');
        } finally {
            setIsExporting(false);
        }
    };

    const getHealthColor = (score: number) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 70) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onReset}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark'
                        ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                >
                    ← Analyze another file
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSecurityScan}
                        disabled={isScanningSecurity}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === 'dark'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                            } ${isScanningSecurity ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {isScanningSecurity ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                        {isScanningSecurity ? 'Scanning...' : (securityResult ? 'Rescan Security' : 'Check Security')}
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === 'dark'
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                            } ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isExporting ? 'Generating...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div
                ref={reportRef}
                className={`p-8 rounded-2xl border shadow-xl ${theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-800'
                    : 'bg-white border-slate-200'
                    }`}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-12 border-b pb-8 border-dashed border-opacity-20 border-gray-400">
                    <div>
                        <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            Analysis Report
                        </h1>
                        <p className={`${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-5xl font-black mb-1 ${getHealthColor(result.healthScore)}`}>
                            {result.healthScore}
                        </div>
                        <div className={`text-sm font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                            Health Score
                        </div>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <SummaryCard
                        title="Total Dependencies"
                        value={result.totalDependencies}
                        icon={Package}
                        theme={theme}
                        color="blue"
                        subtext="All packages"
                    />
                    <SummaryCard
                        title="Dependencies"
                        value={result.summary.totalDeps}
                        icon={Package}
                        theme={theme}
                        color="indigo"
                        subtext="Runtime deps"
                    />
                    <SummaryCard
                        title="Dev Dependencies"
                        value={result.summary.totalDevDeps}
                        icon={Zap}
                        theme={theme}
                        color="yellow"
                        subtext="Development tools"
                    />
                    <SummaryCard
                        title="Outdated"
                        value={result.outdated.length}
                        icon={ArrowUpCircle}
                        theme={theme}
                        color={result.outdated.length > 0 ? "orange" : "green"}
                        subtext={`${result.summary.majorUpdates} major updates`}
                    />
                </div>

                {/* Dependency Lists */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/*Dependencies */}
                    <div>
                        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <Package className="text-blue-500" size={20} />
                            Dependencies
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                                {Object.keys(result.dependencies).length}
                            </span>
                        </h2>
                        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'}`}>
                            <table className="w-full text-sm">
                                <thead className={`${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-slate-50 text-slate-600'}`}>
                                    <tr>
                                        <th className="p-3 text-left font-medium">Package</th>
                                        <th className="p-3 text-right font-medium">Version</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                                    {Object.entries(result.dependencies).slice(0, visibleDepsCount).map(([pkg, ver], i) => (
                                        <tr key={i} className={`${theme === 'dark' ? 'bg-zinc-950/50' : 'bg-white'}`}>
                                            <td className={`p-3 font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>{pkg}</td>
                                            <td className={`p-3 text-right font-mono text-xs opacity-75 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>{ver}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(result.dependencies).length === 0 && (
                                        <tr>
                                            <td colSpan={2} className={`p-4 text-center italic ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>No production dependencies</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {Object.keys(result.dependencies).length > visibleDepsCount && (
                            <button
                                onClick={() => setVisibleDepsCount(prev => prev + 5)}
                                className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark'
                                    ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                    }`}
                            >
                                Show more dependencies ({Object.keys(result.dependencies).length - visibleDepsCount} hidden)
                            </button>
                        )}
                    </div>

                    {/* Dev Dependencies */}
                    <div>
                        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <Zap className="text-yellow-500" size={20} />
                            Dev Dependencies
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                                {Object.keys(result.devDependencies).length}
                            </span>
                        </h2>
                        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'}`}>
                            <table className="w-full text-sm">
                                <thead className={`${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-slate-50 text-slate-600'}`}>
                                    <tr>
                                        <th className="p-3 text-left font-medium">Package</th>
                                        <th className="p-3 text-right font-medium">Version</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                                    {Object.entries(result.devDependencies).slice(0, visibleDevDepsCount).map(([pkg, ver], i) => (
                                        <tr key={i} className={`${theme === 'dark' ? 'bg-zinc-950/50' : 'bg-white'}`}>
                                            <td className={`p-3 font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>{pkg}</td>
                                            <td className={`p-3 text-right font-mono text-xs opacity-75 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>{ver}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(result.devDependencies).length === 0 && (
                                        <tr>
                                            <td colSpan={2} className={`p-4 text-center italic ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>No dev dependencies</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {Object.keys(result.devDependencies).length > visibleDevDepsCount && (
                            <button
                                onClick={() => setVisibleDevDepsCount(prev => prev + 5)}
                                className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark'
                                    ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                    }`}
                            >
                                Show more dev dependencies ({Object.keys(result.devDependencies).length - visibleDevDepsCount} hidden)
                            </button>
                        )}
                    </div>
                </div>

                {/* Outdated Packages Section */}
                {result.outdated.length > 0 && (
                    <div className="mb-12">
                        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <AlertCircle className="text-orange-500" />
                            Outdated Packages
                        </h2>
                        <div className={`overflow-hidden rounded-xl border ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'}`}>
                            <table className="w-full text-left text-sm">
                                <thead className={`${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-slate-50 text-slate-600'}`}>
                                    <tr>
                                        <th className="p-4 font-medium">Package</th>
                                        <th className="p-4 font-medium">Current</th>
                                        <th className="p-4 font-medium">Latest</th>
                                        <th className="p-4 font-medium">Update Type</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                                    {result.outdated.slice(0, visibleOutdatedCount).map((pkg, i) => (
                                        <tr key={i} className={`${theme === 'dark' ? 'bg-zinc-950 hover:bg-zinc-900/50' : 'bg-white hover:bg-slate-50'}`}>
                                            <td className={`p-4 font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}`}>
                                                {pkg.package}
                                            </td>
                                            <td className={`p-4 font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                                                {pkg.current}
                                            </td>
                                            <td className={`p-4 font-mono ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                                {pkg.latest}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${pkg.type === 'major'
                                                    ? (theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700')
                                                    : (theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700')
                                                    }`}>
                                                    {pkg.type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {result.outdated.length > visibleOutdatedCount && (
                            <button
                                onClick={() => setVisibleOutdatedCount(prev => prev + 5)}
                                className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark'
                                    ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                    }`}
                            >
                                Show more outdated packages ({result.outdated.length - visibleOutdatedCount} hidden)
                            </button>
                        )}
                    </div>
                )}

                {/* Security Vulnerabilities Section */}
                {securityResult && (
                    <div className="mb-12">
                        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <Shield className={securityResult.totalVulnerabilities > 0 ? 'text-red-500' : 'text-green-500'} />
                            Security Vulnerabilities
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${securityResult.totalVulnerabilities > 0
                                ? (theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700')
                                : (theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700')
                                }`}>
                                {securityResult.totalVulnerabilities} found
                            </span>
                        </h2>

                        {/* Severity Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            {[
                                { label: 'Total', value: securityResult.totalVulnerabilities, color: 'blue' },
                                { label: 'Critical', value: securityResult.summary.critical, color: 'red' },
                                { label: 'High', value: securityResult.summary.high, color: 'orange' },
                                { label: 'Medium', value: securityResult.summary.moderate, color: 'yellow' },
                                { label: 'Low', value: securityResult.summary.low, color: 'green' },
                            ].map((item) => (
                                <div key={item.label} className={`p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.value}</div>
                                    <div className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>{item.label}</div>
                                </div>
                            ))}
                        </div>

                        {securityResult.totalVulnerabilities > 0 ? (
                            <>
                                <div className={`overflow-hidden rounded-xl border ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'}`}>
                                    <table className="w-full text-left text-sm">
                                        <thead className={`${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-slate-50 text-slate-600'}`}>
                                            <tr>
                                                <th className="p-4 font-medium">Severity</th>
                                                <th className="p-4 font-medium">Package</th>
                                                <th className="p-4 font-medium">ID</th>
                                                <th className="p-4 font-medium">Description</th>
                                                <th className="p-4 font-medium">Fix</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                                            {securityResult.vulnerabilities.slice(0, visibleVulnCount).map((vuln, i) => (
                                                <tr key={i} className={`${theme === 'dark' ? 'bg-zinc-950 hover:bg-zinc-900/50' : 'bg-white hover:bg-slate-50'}`}>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityClasses(vuln.severity)}`}>
                                                            {vuln.severity}
                                                        </span>
                                                    </td>
                                                    <td className={`p-4 font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}`}>
                                                        {vuln.package}
                                                    </td>
                                                    <td className="p-4">
                                                        {vuln.reference ? (
                                                            <a href={vuln.reference} target="_blank" rel="noreferrer"
                                                                className="flex items-center gap-1 text-indigo-500 hover:text-indigo-400 transition-colors font-mono text-xs">
                                                                {vuln.id}
                                                                <ExternalLink size={12} />
                                                            </a>
                                                        ) : (
                                                            <span className={`font-mono text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>{vuln.id}</span>
                                                        )}
                                                    </td>
                                                    <td className={`p-4 text-xs max-w-xs truncate ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                                                        {vuln.summary}
                                                    </td>
                                                    <td className={`p-4 font-mono text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                                        {vuln.fixedVersion || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {securityResult.vulnerabilities.length > visibleVulnCount && (
                                    <button
                                        onClick={() => setVisibleVulnCount(prev => prev + 5)}
                                        className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark'
                                            ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                            }`}
                                    >
                                        Show more vulnerabilities ({securityResult.vulnerabilities.length - visibleVulnCount} hidden)
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className={`p-8 rounded-xl border text-center ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-green-50 border-green-200'}`}>
                                <Shield className={`mx-auto mb-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} size={32} />
                                <p className={`font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>No vulnerabilities detected</p>
                                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>All packages passed the security scan</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className={`pt-8 border-t flex items-center justify-between text-xs ${theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-400'
                    }`}>
                    <span>Generated by PackageAnalyzer</span>
                    <span>Not legal advice. Verify all security findings independently.</span>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon: Icon, theme, color, subtext }: any) => {
    const getColorClasses = () => {
        const base = theme === 'dark';
        switch (color) {
            case 'red': return base ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600';
            case 'orange': return base ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-orange-600';
            case 'yellow': return base ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-50 text-yellow-600';
            case 'green': return base ? 'bg-green-500/10 text-green-500' : 'bg-green-50 text-green-600';
            case 'indigo': return base ? 'bg-indigo-500/10 text-indigo-500' : 'bg-indigo-50 text-indigo-600';
            default: return base ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-50 text-blue-600';
        }
    };

    return (
        <div className={`p-6 rounded-xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
            <div className={`p-3 rounded-lg ${getColorClasses()}`}>
                <Icon size={24} />
            </div>
            <div>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {value}
                </div>
                <div className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {title}
                </div>
                {subtext && (
                    <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>
                        {subtext}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportView;
