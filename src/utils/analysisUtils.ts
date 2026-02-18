export interface OutdatedPackage {
    package: string;
    current: string;
    latest: string;
    type: 'major' | 'minor' | 'patch';
}

export interface AnalysisResult {
    healthScore: number;
    totalDependencies: number;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    outdated: OutdatedPackage[];
    summary: {
        outdated: number;
        totalDeps: number;
        totalDevDeps: number;
        majorUpdates: number;
        minorUpdates: number;
        patchUpdates: number;
    };
}

export const calculateHealthScore = (outdated: OutdatedPackage[]): number => {
    let score = 100;

    // Deduct for outdated packages
    outdated.forEach(o => {
        switch (o.type) {
            case 'major': score -= 10; break;
            case 'minor': score -= 5; break;
            case 'patch': score -= 2; break;
        }
    });

    return Math.max(0, Math.round(score));
};
const API_URL = import.meta.env.VITE_API_URL;

export const analyzeDependencies = async (packageJson: any): Promise<AnalysisResult> => {
    try {
        const response = await fetch(`${API_URL}report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(packageJson),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Analysis failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("data: ", data)
        return data.data as AnalysisResult;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// --- Security Vulnerability Check ---

export interface SecurityVulnerability {
    id: string;
    package: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
    summary: string;
    fixedVersion: string | null;
    reference: string | null;
}

export interface SecurityResult {
    totalVulnerabilities: number;
    vulnerabilities: SecurityVulnerability[];
    summary: {
        critical: number;
        high: number;
        moderate: number;
        low: number;
    }
}

// const mapSeverity = (vuln: any): SecurityVulnerability['severity'] => {
//     const severity = vuln.database_specific?.severity
//         || vuln.severity?.[0]?.type === 'CVSS_V3' && getCvssSeverity(vuln.severity[0].score)
//         || 'UNKNOWN';
//     const upper = String(severity).toUpperCase();
//     if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(upper)) return upper as SecurityVulnerability['severity'];
//     return 'UNKNOWN';
// };

// const getCvssSeverity = (score: string): string => {
//     const num = parseFloat(score);
//     if (num >= 9.0) return 'CRITICAL';
//     if (num >= 7.0) return 'HIGH';
//     if (num >= 4.0) return 'MEDIUM';
//     return 'LOW';
// };

export const checkSecurityVulnerabilities = async (packageJson: any): Promise<SecurityResult> => {
    try {
        // const response = await fetch('http://localhost:3000/api/v1/analyzer/vulnerabilities', {
        const response = await fetch(`${API_URL}vulnerabilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(packageJson),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Analysis failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("data: ", data)

        return {
            totalVulnerabilities: data.data.vulnerabilities.length,
            vulnerabilities: data.data.vulnerabilities,
            summary: data.data.summary
        };

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};
