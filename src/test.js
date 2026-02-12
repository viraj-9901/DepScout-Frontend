const fs = require('fs');
const semver = require('semver');
const { exec } = require('child_process');
const util = require('util');
const { PackageSearch } = require('lucide-react');
const execPromise = util.promisify(exec);

async function analyzeDependencies() {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  // Get all dependencies
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  // Step 1: Get npm outdated info
  const npmData = await getNpmOutdatedData();

  // Step 2: Get npm audit info
  const auditData = await getNpmAuditData();

  // Step 3: Use semver for version comparison
  const semverAnalysis = analyzeSemverUpdates(allDeps, npmData);

  // Step 4: Prepare data for AI
  const aiPromptData = prepareAIPromptData(packageJson, semverAnalysis, auditData);

  // Step 5: Send to AI and get enhanced analysis
  const aiAnalysis = await sendToAI(aiPromptData);

  // Step 6: Combine results
  const finalReport = combineResults(semverAnalysis, auditData, aiAnalysis);

  return finalReport;
}

// Get npm outdated information
async function getNpmOutdatedData() {
  try {
    const { stdout } = await execPromise('npm outdated --json');
    return JSON.parse(stdout);
  } catch (error) {
    // npm outdated returns exit code 1 when outdated packages exist
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    return {};
  }
}

// Get npm audit information
async function getNpmAuditData() {
  try {
    const { stdout } = await execPromise('npm audit --json');
    return JSON.parse(stdout);
  } catch (error) {
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    return { vulnerabilities: {} };
  }
}

// Analyze versions using semver
function analyzeSemverUpdates(dependencies, npmOutdated) {
  const analysis = [];

  for (const [pkg, currentVersion] of Object.entries(dependencies)) {
    if (npmOutdated[pkg]) {
      const current = npmOutdated[pkg].current;
      const latest = npmOutdated[pkg].latest;
      const wanted = npmOutdated[pkg].wanted;

      let updateType = 'patch';

      if (semver.valid(current) && semver.valid(latest)) {
        const currentClean = semver.clean(current);
        const latestClean = semver.clean(latest);

        if (semver.major(currentClean) < semver.major(latestClean)) {
          updateType = 'major';
        } else if (semver.minor(currentClean) < semver.minor(latestClean)) {
          updateType = 'minor';
        } else if (semver.patch(currentClean) < semver.patch(latestClean)) {
          updateType = 'patch';
        }
      }

      analysis.push({
        package: pkg,
        current: current,
        wanted: wanted,
        latest: latest,
        type: updateType,
        versionRange: currentVersion
      });
    }
  }

  return analysis;
}

// Prepare comprehensive data for AI
function prepareAIPromptData(packageJson, semverAnalysis, auditData) {
  return {
    packageJson: packageJson,
    outdatedPackages: semverAnalysis,
    vulnerabilities: formatVulnerabilities(auditData),
    npmAuditSummary: auditData.metadata || {}
  };
}

// Format vulnerabilities from npm audit
function formatVulnerabilities(auditData) {
  const vulnerabilities = [];

  if (auditData.vulnerabilities) {
    for (const [pkg, vulnInfo] of Object.entries(auditData.vulnerabilities)) {
      if (vulnInfo.via && Array.isArray(vulnInfo.via)) {
        vulnInfo.via.forEach(via => {
          if (typeof via === 'object') {
            vulnerabilities.push({
              package: pkg,
              severity: via.severity,
              title: via.title,
              url: via.url,
              range: via.range,
              fixAvailable: vulnInfo.fixAvailable
            });
          }
        });
      }
    }
  }

  return vulnerabilities;
}

// Send to AI (using Claude API or similar)
async function sendToAI(data) {
  const prompt = `${AI_ANALYSIS_PROMPT}

Here is the dependency data:

${JSON.stringify(data, null, 2)}

Please analyze and return the complete JSON report.`;

  // Example using fetch to call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  const result = await response.json();
  return JSON.parse(result.content[0].text);
}

// Combine all results into final report
function combineResults(semverAnalysis, auditData, aiAnalysis) {
  // Enhance AI analysis with accurate semver data
  const enhancedOutdated = aiAnalysis.outdated.map(item => {
    const semverMatch = semverAnalysis.find(s => s.package === item.package);
    if (semverMatch) {
      return {
        ...item,
        current: semverMatch.current,
        latest: semverMatch.latest,
        wanted: semverMatch.wanted,
        type: semverMatch.type,
        versionRange: semverMatch.versionRange
      };
    }
    return item;
  });

  // Enhance vulnerabilities with npm audit data
  const enhancedVulnerabilities = formatVulnerabilities(auditData);

  // Calculate accurate health score
  const healthScore = calculateHealthScore(
    enhancedOutdated,
    enhancedVulnerabilities,
    semverAnalysis
  );

  return {
    ...aiAnalysis,
    outdated: enhancedOutdated,
    vulnerabilities: enhancedVulnerabilities,
    summary: {
      ...aiAnalysis.summary,
      healthScore: healthScore,
      outdated: enhancedOutdated.length,
      outdatedByType: {
        major: enhancedOutdated.filter(d => d.type === 'major').length,
        minor: enhancedOutdated.filter(d => d.type === 'minor').length,
        patch: enhancedOutdated.filter(d => d.type === 'patch').length
      },
      vulnerabilities: {
        critical: enhancedVulnerabilities.filter(v => v.severity === 'critical').length,
        high: enhancedVulnerabilities.filter(v => v.severity === 'high').length,
        moderate: enhancedVulnerabilities.filter(v => v.severity === 'moderate').length,
        low: enhancedVulnerabilities.filter(v => v.severity === 'low').length,
        total: enhancedVulnerabilities.length
      }
    },
    metadata: {
      analyzedAt: new Date().toISOString(),
      toolsUsed: ['npm-outdated', 'npm-audit', 'semver', 'ai-analysis']
    }
  };
}

// Calculate health score
function calculateHealthScore(outdated, vulnerabilities, semverAnalysis) {
  let score = 100;

  // Vulnerability impact (50% weight)
  vulnerabilities.forEach(v => {
    if (v.severity === 'critical') score -= 15;
    else if (v.severity === 'high') score -= 10;
    else if (v.severity === 'moderate') score -= 5;
    else if (v.severity === 'low') score -= 2;
  });

  // Outdated packages (30% weight)
  outdated.forEach(d => {
    if (d.type === 'major') score -= 5;
    else if (d.type === 'minor') score -= 2;
    else if (d.type === 'patch') score -= 1;
  });

  // Age calculation (20% weight) - simplified
  const now = new Date();
  semverAnalysis.forEach(dep => {
    // This would need package publish dates from npm registry
    // Simplified here
  });

  return Math.max(0, Math.min(100, score));
}

// AI Analysis Prompt (the one we created earlier)
const AI_ANALYSIS_PROMPT = `Analyze the provided package.json file and generate a comprehensive dependency analysis report. Perform a thorough examination of all dependencies, check for updates, identify security vulnerabilities, assess compatibility issues, and provide actionable recommendations. Return the results in a structured JSON format with detailed metadata.

Analysis Requirements:

1. Dependency Inventory - Extract and catalog all production dependencies and devDependencies, preserve exact version ranges as specified in package.json, and calculate total dependency counts.

2. Version Update Detection - For each dependency, query the npm registry to identify the currently installed version, determine the latest available version, and categorize updates using semantic versioning rules: Major for breaking changes, Minor for new features that are backward compatible, and Patch for bug fixes that are backward compatible.

3. Security Vulnerability Assessment - Identify all known security vulnerabilities in current dependency versions, include CVE/advisory IDs where available, categorize by severity (Critical, High, Moderate, Low), specify the minimum version that resolves each vulnerability, and note any dependencies with multiple vulnerabilities.

4. Compatibility Analysis - Detect peer dependency mismatches, identify conflicting version requirements between dependencies, check Node.js version compatibility issues, and flag dependencies that may have known conflicts with each other.

5. Update Prioritization - For each outdated dependency, provide classification: Update Now for critical security fixes; Consider Updating for beneficial features; Safe to Skip for cosmetic changes; Research Required for major version updates.

6. Provide actionable recommendations with priority classifications and effort estimates.

Return ONLY valid JSON with no markdown formatting.`;

// Main execution
analyzeDependencies()
  .then(report => {
    console.log(JSON.stringify(report, null, 2));
    fs.writeFileSync('./dependency-report.json', JSON.stringify(report, null, 2));
    console.log('\nReport saved to dependency-report.json');
  })
  .catch(error => {
    console.error('Error analyzing dependencies:', error);
    process.exit(1);
  });
