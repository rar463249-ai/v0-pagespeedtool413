"use client"

import type React from "react"

import { useState } from "react"

export default function SpeedAnalyzer() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState("")
  const [currentAnalysis, setCurrentAnalysis] = useState(null)

  const showAnalyzer = () => {
    const form = document.getElementById("analyzeForm")
    if (form) {
      form.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedUrl = url.trim()
    const device = "desktop"

    if (!trimmedUrl) {
      setError("Please enter a valid URL")
      return
    }

    // Validate URL format
    try {
      new URL(trimmedUrl)
    } catch (e) {
      setError("Please enter a valid URL (including http:// or https://)")
      return
    }

    await analyzeWebsite(trimmedUrl, device)
  }

  const analyzeWebsite = async (url: string, device: string) => {
    setIsLoading(true)
    setError("")
    setResults(null)

    console.log("[v0] Starting website analysis for:", url)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          device: device,
        }),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Analysis completed successfully")

      if (data.error) {
        throw new Error(data.error)
      }

      setCurrentAnalysis(data)
      setResults(data)
      setIsLoading(false)
    } catch (error: any) {
      console.error("[v0] Analysis error:", error)
      setError(error.message || "Failed to analyze website. Please try again.")
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setUrl("")
    setResults(null)
    setError("")
    setCurrentAnalysis(null)
  }

  const downloadResults = () => {
    if (!currentAnalysis) {
      alert("No analysis data available to download")
      return
    }

    const harData = {
      log: {
        version: "1.2",
        creator: {
          name: "SpeedAnalyzer",
          version: "1.0",
        },
        pages: [
          {
            startedDateTime: new Date(currentAnalysis.timestamp).toISOString(),
            id: "page_1",
            title: currentAnalysis.url,
            pageTimings: {
              onContentLoad: currentAnalysis.metrics.fcp?.numericValue || -1,
              onLoad: currentAnalysis.metrics.lcp?.numericValue || -1,
            },
          },
        ],
        entries: [],
      },
    }

    const dataStr = JSON.stringify(harData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `performance-analysis-${new Date().toISOString().split("T")[0]}.har`
    link.click()
  }

  const shareResults = () => {
    if (!currentAnalysis) {
      alert("No analysis data available to share")
      return
    }

    const shareData = {
      title: `Performance Analysis - ${currentAnalysis.url}`,
      text: `Performance analysis results for ${currentAnalysis.url}`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      const shareText = `Performance Analysis Results\nURL: ${currentAnalysis.url}\nPerformance Score: ${currentAnalysis.scores.performance}/100\nAnalyzed: ${new Date(currentAnalysis.timestamp).toLocaleString()}`

      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          alert("Results copied to clipboard!")
        })
        .catch(() => {
          alert("Unable to share results. Please copy the URL manually.")
        })
    }
  }

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: "A", bgColor: "bg-green-500" }
    if (score >= 80) return { grade: "B", bgColor: "bg-green-400" }
    if (score >= 70) return { grade: "C", bgColor: "bg-yellow-500" }
    if (score >= 60) return { grade: "D", bgColor: "bg-orange-500" }
    return { grade: "F", bgColor: "bg-red-500" }
  }

  const getMetricStatus = (score: number) => {
    if (score >= 0.9) return { status: "GOOD", colorClass: "text-green-600 bg-green-100" }
    if (score >= 0.5) return { status: "NEEDS IMPROVEMENT", colorClass: "text-yellow-600 bg-yellow-100" }
    return { status: "POOR", colorClass: "text-red-600 bg-red-100" }
  }

  return (
    <div className="bg-gray-50 text-slate-700 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="text-orange-500 font-bold text-lg mr-2">⚡</div>
                <h1 className="text-xl font-bold text-slate-800">SpeedAnalyzer</h1>
                <span className="text-xs text-slate-500 ml-2">pingdom</span>
              </div>
              <div className="hidden md:flex space-x-6">
                <div className="relative group">
                  <a href="#" className="text-slate-600 hover:text-slate-800 font-medium">
                    Products ▼
                  </a>
                </div>
                <div className="relative group">
                  <a href="#" className="text-slate-600 hover:text-slate-800 font-medium">
                    Solutions ▼
                  </a>
                </div>
                <a href="#" className="text-slate-600 hover:text-slate-800 font-medium">
                  Pricing
                </a>
                <div className="relative group">
                  <a href="#" className="text-slate-600 hover:text-slate-800 font-medium">
                    Resources ▼
                  </a>
                </div>
                <a href="#" className="text-slate-600 hover:text-slate-800 font-medium">
                  Customers
                </a>
                <div className="relative group">
                  <a href="#" className="text-slate-600 hover:text-slate-800 font-medium">
                    Tools ▼
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>
        {/* Hero Section with Speed Test Form */}
        <section className="bg-gradient-to-br from-yellow-400 to-orange-500 text-slate-800 py-16">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">SpeedAnalyzer Website Speed Test</h1>
            <p className="text-lg mb-8 opacity-90">
              Enter a URL to test the page load time, analyze it, and find bottlenecks.
            </p>

            {/* Speed Test Form */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <form id="analyzeForm" onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2 text-left">URL</label>
                  </div>
                  <div className="md:col-span-8">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {isLoading ? "TESTING..." : "START TEST"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            {/* Loading State */}
            {isLoading && (
              <div className="py-12 bg-white mb-16">
                <div className="container mx-auto px-6 text-center">
                  <div className="w-10 h-10 border-3 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg text-slate-600">Analyzing website performance...</p>
                  <p className="text-sm text-slate-500 mt-2">This may take up to 30 seconds</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="py-12 bg-white mb-16">
                <div className="container mx-auto px-6 max-w-4xl">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                    <h3 className="text-xl font-bold text-red-700 mb-4">Analysis Failed</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={resetForm}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            {results && !isLoading && (
              <section className="py-12 bg-white mb-16">
                <div className="container mx-auto px-6 max-w-6xl">
                  {/* Results Header */}
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Your Results:</h2>
                    <div className="flex space-x-4">
                      <button
                        onClick={downloadResults}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                        DOWNLOAD HAR
                      </button>
                      <button
                        onClick={shareResults}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          ></path>
                        </svg>
                        SHARE RESULT
                      </button>
                    </div>
                  </div>

                  {/* Main Results Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Website Screenshot */}
                    <div className="lg:col-span-1">
                      <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                        {results.screenshot?.data ? (
                          <img
                            src={`data:image/jpeg;base64,${results.screenshot.data}`}
                            alt="Website Screenshot"
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: "240px" }}
                          />
                        ) : (
                          <div className="text-center">
                            <svg
                              className="w-16 h-16 text-gray-400 mx-auto mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              ></path>
                            </svg>
                            <p className="text-slate-500 text-sm">Screenshot loading...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Performance Details */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white border rounded-lg p-6 text-center">
                          <h3 className="text-sm font-medium text-slate-600 mb-3">Performance grade</h3>
                          <div className="flex items-center justify-center mb-2">
                            {(() => {
                              const { grade, bgColor } = getPerformanceGrade(results.scores?.performance || 0)
                              return (
                                <>
                                  <span className={`text-2xl font-bold ${bgColor} text-white px-3 py-1 rounded`}>
                                    {grade}
                                  </span>
                                  <span className="text-2xl font-bold ml-2">{results.scores?.performance || -1}</span>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Web Vitals */}
                  <div className="bg-white rounded-lg border p-6 mb-8">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">Core Web Vitals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {[
                        { key: "fcp", name: "First Contentful Paint", good: "< 1.8s" },
                        { key: "lcp", name: "Largest Contentful Paint", good: "< 2.5s" },
                        { key: "tbt", name: "Total Blocking Time", good: "< 200ms" },
                        { key: "cls", name: "Cumulative Layout Shift", good: "< 0.1" },
                        { key: "si", name: "Speed Index", good: "< 3.4s" },
                      ].map((metric) => {
                        const metricData = results.metrics?.[metric.key]
                        const { status, colorClass } = getMetricStatus(metricData?.score || 0)

                        return (
                          <div key={metric.key} className="text-center">
                            <h4 className="text-sm font-medium text-slate-600 mb-3">{metric.name}</h4>
                            <div
                              className={`text-2xl font-bold mb-2 ${metricData?.score >= 0.9 ? "text-green-600" : metricData?.score >= 0.5 ? "text-yellow-600" : "text-red-600"}`}
                            >
                              {metricData?.displayValue || "-"}
                            </div>
                            <div className={`text-xs font-medium px-2 py-1 rounded ${colorClass}`}>{status}</div>
                            <div className="text-xs text-slate-500 mt-1">Good {metric.good}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Opportunities Section */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">Opportunities</h3>
                    <div>
                      {results.opportunities && results.opportunities.length > 0 ? (
                        results.opportunities.map((opportunity: any, index: number) => {
                          const priority =
                            opportunity.score <= 0.5
                              ? { label: "High", colorClass: "bg-red-500", badgeClass: "bg-red-100 text-red-800" }
                              : opportunity.score <= 0.8
                                ? {
                                    label: "Medium",
                                    colorClass: "bg-yellow-500",
                                    badgeClass: "bg-yellow-100 text-yellow-800",
                                  }
                                : {
                                    label: "Low",
                                    colorClass: "bg-green-500",
                                    badgeClass: "bg-green-100 text-green-800",
                                  }

                          return (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`${priority.colorClass} w-6 h-6 rounded-full flex items-center justify-center`}
                                  >
                                    <span className="text-white text-xs font-bold">{index + 1}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-700">{opportunity.title}</h4>
                                    <span
                                      className={`${priority.badgeClass} text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block`}
                                    >
                                      {priority.label}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-slate-600 text-sm mb-2">{opportunity.description}</p>

                              {opportunity.savings && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                  <div className="flex items-center space-x-2">
                                    <svg
                                      className="w-4 h-4 text-orange-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                      ></path>
                                    </svg>
                                    <span className="text-orange-800 font-medium text-sm">
                                      Potential savings: {opportunity.savings}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-slate-500">No optimization opportunities found</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Why Website Speed Matters section */}
            {!results && !isLoading && !error && (
              <>
                <h2 className="text-3xl font-bold mb-6 text-slate-800">Why Website Speed Matters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Better User Experience</h3>
                    <p className="text-slate-600">
                      Fast-loading websites provide better user experience and reduce bounce rates.
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        ></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Higher Search Rankings</h3>
                    <p className="text-slate-600">
                      Google considers page speed as a ranking factor for search results.
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        ></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Increased Conversions</h3>
                    <p className="text-slate-600">
                      Faster websites lead to higher conversion rates and better business results.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 SpeedAnalyzer. Built with Google PageSpeed Insights API.</p>
        </div>
      </footer>

      {/* Full-screen loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="w-10 h-10 border-3 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Website Performance</h3>
            <p className="text-slate-600 mb-4">Please wait while we analyze your website...</p>
            <p className="text-sm text-slate-500">This may take up to 30 seconds</p>
          </div>
        </div>
      )}
    </div>
  )
}
