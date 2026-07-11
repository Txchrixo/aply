"use client";
/**
 * API Explorer - swagger-like page to test all Aply API endpoints.
 * Lists every endpoint with method, description, parameters, and a test button.
 */
import { useState, useCallback } from "react";
import { Icon } from "@/components/aply/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  params?: Array<{ name: string; type: string; required: boolean; description: string }>;
  bodyExample?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/stats",
    description: "Get dashboard statistics (platforms, pending approvals, offers, etc.)",
  },
  {
    method: "GET",
    path: "/api/platforms",
    description: "List monitored platforms with filtering and pagination",
    params: [
      { name: "page", type: "number", required: false, description: "Page number (default 1)" },
      { name: "pageSize", type: "number", required: false, description: "Items per page (default 24)" },
      { name: "category", type: "string", required: false, description: "Filter by category" },
      { name: "q", type: "string", required: false, description: "Search by name" },
      { name: "enabled", type: "boolean", required: false, description: "Filter enabled only" },
    ],
  },
  {
    method: "GET",
    path: "/api/companies",
    description: "List all tracked companies with career pages and offer counts",
  },
  {
    method: "GET",
    path: "/api/jobs",
    description: "List detected job offers",
    params: [
      { name: "status", type: "string", required: false, description: "Filter by status (new, pending_approval, applied, etc.)" },
      { name: "page", type: "number", required: false, description: "Page number" },
    ],
  },
  {
    method: "GET",
    path: "/api/jobs/{id}/details",
    description: "Get full job details: company info, cross-references, form requirements, credential",
    params: [{ name: "id", type: "string", required: true, description: "Job offer ID" }],
  },
  {
    method: "POST",
    path: "/api/jobs/{id}/import",
    description: "Run the import pipeline (detect fields, generate letter, answer questions)",
    params: [{ name: "id", type: "string", required: true, description: "Job offer ID" }],
  },
  {
    method: "GET",
    path: "/api/applications",
    description: "List applications with filtering",
    params: [{ name: "status", type: "string", required: false, description: "Filter by status" }],
  },
  {
    method: "POST",
    path: "/api/generate",
    description: "Generate a cover letter using the LLM provider",
    bodyExample: JSON.stringify({ jobOfferId: "offer-1" }, null, 2),
  },
  {
    method: "POST",
    path: "/api/answer-form",
    description: "Answer custom form questions using the LLM + resume",
    bodyExample: JSON.stringify({ jobOfferId: "offer-1" }, null, 2),
  },
  {
    method: "POST",
    path: "/api/scan",
    description: "Trigger a monitoring scan (fetches new offers from RSS/ATS)",
  },
  {
    method: "POST",
    path: "/api/applications/{id}/approve",
    description: "Approve and submit an application",
    params: [{ name: "id", type: "string", required: true, description: "Application ID" }],
    bodyExample: JSON.stringify({ channel: "dashboard" }, null, 2),
  },
  {
    method: "POST",
    path: "/api/applications/{id}/reject",
    description: "Reject an application",
    params: [{ name: "id", type: "string", required: true, description: "Application ID" }],
  },
  {
    method: "GET",
    path: "/api/settings",
    description: "Get user settings (emails, notifications, preferences)",
  },
  {
    method: "POST",
    path: "/api/settings",
    description: "Update user settings",
    bodyExample: JSON.stringify({ monitoringEnabled: true, scanIntervalMinutes: 15 }, null, 2),
  },
  {
    method: "GET",
    path: "/api/analytics",
    description: "Get analytics data (weekly charts, status distribution, quality trends)",
  },
  {
    method: "GET",
    path: "/api/digest",
    description: "Get weekly digest with email preview",
  },
  {
    method: "GET",
    path: "/api/export",
    description: "Export applications as CSV",
    params: [{ name: "format", type: "string", required: false, description: "csv (default)" }],
  },
  {
    method: "GET",
    path: "/api/extension/download",
    description: "Download the Chrome extension as a ZIP file",
  },
  {
    method: "GET",
    path: "/api/ats/jobs",
    description: "Fetch real jobs from a company's ATS (Greenhouse/Lever)",
    params: [{ name: "company", type: "string", required: true, description: "Company name" }],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-[#2ea043]/10 text-[#2ea043]",
  POST: "bg-primary/10 text-primary",
  PATCH: "bg-accent/10 text-accent",
  DELETE: "bg-[#B23A1E]/10 text-[#B23A1E]",
};

export default function ApiExplorerPage() {
  const [selected, setSelected] = useState<Endpoint | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState("");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);

  const buildUrl = useCallback((endpoint: Endpoint) => {
    let url = endpoint.path;
    for (const [key, value] of Object.entries(paramValues)) {
      if (value) {
        if (url.includes(`{${key}}`)) {
          url = url.replace(`{${key}}`, encodeURIComponent(value));
        } else {
          url += (url.includes("?") ? "&" : "?") + `${key}=${encodeURIComponent(value)}`;
        }
      }
    }
    return url;
  }, [paramValues]);

  const handleTest = async () => {
    if (!selected) return;
    setLoading(true);
    setResponse("");
    setStatus(null);
    try {
      const url = buildUrl(selected);
      const options: RequestInit = { method: selected.method };
      if (selected.method === "POST" || selected.method === "PATCH") {
        options.headers = { "Content-Type": "application/json" };
        options.body = bodyText || "{}";
      }
      const res = await fetch(url, options);
      setStatus(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text.slice(0, 2000));
      }
    } catch (err) {
      setResponse(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (ep: Endpoint) => {
    setSelected(ep);
    setParamValues({});
    setBodyText(ep.bodyExample ?? "");
    setResponse("");
    setStatus(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <a href="/dashboard" className="flex items-center gap-2">
            <Icon name="rocket" size={20} className="text-primary" />
            <span className="font-heading font-semibold">Aply</span>
          </a>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">API Explorer</span>
          <a href="/dashboard" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Back to dashboard
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Endpoint list */}
          <div className="lg:col-span-1">
            <h2 className="mb-3 font-heading text-lg font-semibold">Endpoints</h2>
            <div className="space-y-1">
              {ENDPOINTS.map((ep) => (
                <button
                  key={`${ep.method}-${ep.path}`}
                  onClick={() => handleSelect(ep)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selected?.path === ep.path && selected?.method === ep.method
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", METHOD_COLORS[ep.method])}>
                    {ep.method}
                  </span>
                  <span className="truncate font-mono text-xs">{ep.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail + test */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-bold", METHOD_COLORS[selected.method])}>
                      {selected.method}
                    </span>
                    <code className="font-mono text-sm">{selected.path}</code>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>
                </div>

                {selected.params && selected.params.length > 0 && (
                  <div className="space-y-2">
                    <Label>Parameters</Label>
                    {selected.params.map((p) => (
                      <div key={p.name} className="flex items-center gap-2">
                        <div className="w-32 shrink-0">
                          <code className="text-xs font-medium">{p.name}</code>
                          {p.required && <span className="ml-1 text-[#B23A1E]">*</span>}
                        </div>
                        <Input
                          placeholder={p.type}
                          value={paramValues[p.name] ?? ""}
                          onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                          className="touch-target flex-1"
                        />
                        <span className="hidden text-xs text-muted-foreground sm:inline">{p.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(selected.method === "POST" || selected.method === "PATCH") && (
                  <div className="space-y-1.5">
                    <Label>Request body (JSON)</Label>
                    <Textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      className="h-40 font-mono text-xs"
                    />
                  </div>
                )}

                <Button onClick={handleTest} disabled={loading} className="gap-2">
                  {loading ? <Icon name="sync" size={14} className="animate-spin" /> : <Icon name="play" size={14} />}
                  Send request
                </Button>

                {status !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={cn("font-bold", status >= 200 && status < 300 ? "text-[#2ea043]" : "text-[#B23A1E]")}>
                      {status}
                    </span>
                  </div>
                )}

                {response && (
                  <div>
                    <Label>Response</Label>
                    <pre className="mt-1 max-h-96 overflow-y-auto rounded-lg bg-card p-4 text-xs ring-1 ring-border/40 aply-scroll">
                      <code className="font-mono">{response}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select an endpoint to test it
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
