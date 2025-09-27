import { type NextRequest, NextResponse } from "next/server"

// Configuration - you'll need to add your Google PageSpeed Insights API key
const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY || "YOUR_GOOGLE_PAGESPEED_API_KEY"
const API_BASE_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(body.url)
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const device = body.device || "desktop"
    if (!["mobile", "desktop"].includes(device)) {
      return NextResponse.json({ error: "Invalid device type" }, { status: 400 })
    }

    // Analyze the website
    const result = await analyzeWebsite(body.url, device)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: error.message || "Failed to analyze website" }, { status: 500 })
  }
}

/**
 * Analyze website using Google PageSpeed Insights API
 */
async function analyzeWebsite(url: string, device: string) {
  // Build API URL with parameters
  const apiUrl = new URL(API_BASE_URL)
  apiUrl.searchParams.set("url", url)
  apiUrl.searchParams.set("key", API_KEY)
  apiUrl.searchParams.set("strategy", device.toUpperCase())
  apiUrl.searchParams.set("category", "PERFORMANCE")
  apiUrl.searchParams.set("category", "ACCESSIBILITY")
  apiUrl.searchParams.set("category", "BEST_PRACTICES")
  apiUrl.searchParams.set("category", "SEO")
  apiUrl.searchParams.set("locale", "en")

  console.log("[v0] Making API request to:", apiUrl.toString().replace(API_KEY, "HIDDEN"))

  // Make API request
  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "User-Agent": "SpeedAnalyzer/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`PageSpeed API returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`)
  }

  console.log("[v0] API response received, processing results...")

  return processResults(data, url, device)
}

/**
 * Process and format PageSpeed Insights results
 */
function processResults(data: any, url: string, device: string) {
  const lighthouse = data.lighthouseResult
  const categories = lighthouse.categories
  const audits = lighthouse.audits

  // Extract scores
  const scores = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories["best-practices"]?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
  }

  // Extract Core Web Vitals metrics
  const metrics = {
    fcp: formatMetric(audits["first-contentful-paint"]),
    lcp: formatMetric(audits["largest-contentful-paint"]),
    tbt: formatMetric(audits["total-blocking-time"]),
    cls: formatMetric(audits["cumulative-layout-shift"]),
    si: formatMetric(audits["speed-index"]),
  }

  const screenshot = extractScreenshot(audits)

  // Extract opportunities (performance improvements)
  const opportunities: any[] = []
  Object.entries(audits).forEach(([auditId, audit]: [string, any]) => {
    if (audit.details?.type === "opportunity" && audit.numericValue && audit.numericValue > 0) {
      opportunities.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        savings: audit.displayValue || null,
        score: audit.score || 0,
      })
    }
  })

  // Sort opportunities by potential impact (lower score = higher impact)
  opportunities.sort((a, b) => a.score - b.score)

  // Prepare final result
  const result = {
    url,
    timestamp: new Date().toISOString(),
    device: device.toLowerCase(),
    scores,
    metrics,
    screenshot,
    opportunities: opportunities.slice(0, 10), // Limit to top 10
    rawData: {
      loadingExperience: data.loadingExperience || null,
      originLoadingExperience: data.originLoadingExperience || null,
    },
  }

  console.log("[v0] Results processed successfully")
  return result
}

/**
 * Extract screenshot from audit data
 */
function extractScreenshot(audits: any) {
  // Try different screenshot audit types
  const screenshotAudits = ["final-screenshot", "screenshot-thumbnails", "full-page-screenshot"]

  for (const auditType of screenshotAudits) {
    if (audits[auditType]) {
      const audit = audits[auditType]

      // Handle final-screenshot
      if (auditType === "final-screenshot" && audit.details?.data) {
        return {
          data: audit.details.data.replace("data:image/jpeg;base64,", ""),
          timestamp: audit.details.timestamp || null,
          type: "final",
          width: audit.details.width || null,
          height: audit.details.height || null,
        }
      }

      // Handle screenshot-thumbnails
      if (auditType === "screenshot-thumbnails" && audit.details?.items?.length > 0) {
        const item = audit.details.items[0]
        if (item.data) {
          return {
            data: item.data.replace("data:image/jpeg;base64,", ""),
            timestamp: item.timing || null,
            type: "thumbnail",
            width: null,
            height: null,
          }
        }
      }

      // Handle full-page-screenshot
      if (auditType === "full-page-screenshot" && audit.details?.screenshot?.data) {
        return {
          data: audit.details.screenshot.data.replace("data:image/jpeg;base64,", ""),
          timestamp: null,
          type: "full-page",
          width: audit.details.screenshot.width || null,
          height: audit.details.screenshot.height || null,
        }
      }
    }
  }

  return null
}

/**
 * Format individual metric data
 */
function formatMetric(audit: any) {
  if (!audit) {
    return {
      value: null,
      displayValue: "N/A",
      rating: "poor",
      score: 0,
    }
  }

  const value = audit.numericValue || 0
  const displayValue = audit.displayValue || "N/A"

  // Determine rating based on audit score
  const score = audit.score || 0
  let rating = "poor"
  if (score >= 0.9) {
    rating = "good"
  } else if (score >= 0.5) {
    rating = "needs-improvement"
  }

  return {
    value,
    displayValue,
    rating,
    score,
  }
}
