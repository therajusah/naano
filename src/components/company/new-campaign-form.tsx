"use client";

// Create-campaign form + AI brief generator (the star feature).
//
// Left: campaign fields. Right: an AI brief generator that POSTs to
// /api/ai/brief and renders the returned structured brief in an EDITABLE card.
// If the API returns 503 (no OpenAI key) the user sees a friendly message and
// can still fill the brief in manually. On submit, everything is sent to the
// createCampaign server action which owns validation + persistence.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VERTICALS } from "@/lib/constants";
import type { GeneratedBrief } from "@/lib/ai/brief-schema";
import { createCampaign } from "@/app/actions/campaigns";

type BriefState = GeneratedBrief;

const EMPTY_BRIEF: BriefState = {
  angle: "",
  hook: "",
  cta: "",
  keyMessages: [""],
  audience: "",
  toneOfVoice: "",
  doList: [""],
  dontList: [""],
  proofPoints: [""],
};

const LIST_MAX_ITEMS = 8;

type ListField = "keyMessages" | "doList" | "dontList" | "proofPoints";
type TextField = "angle" | "hook" | "cta" | "audience" | "toneOfVoice";

export function NewCampaignForm() {
  const router = useRouter();
  const [isSubmitting, startSubmit] = useTransition();

  // Campaign fields
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [vertical, setVertical] = useState("");
  const [budget, setBudget] = useState("");
  const [targetPostCount, setTargetPostCount] = useState("");
  const [icp, setIcp] = useState("");

  // AI generator inputs
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyPoints, setKeyPoints] = useState("");

  // Brief state (editable, may be AI-generated or manual)
  const [brief, setBrief] = useState<BriefState | null>(null);
  const [briefGeneratedByAI, setBriefGeneratedByAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const ensureBrief = () => {
    if (!brief) setBrief(EMPTY_BRIEF);
  };

  async function generateBrief() {
    setAiNotice(null);
    setFormError(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName || name,
          productDescription,
          targetAudience: targetAudience || icp,
          objective: objective || "Drive qualified pipeline",
          vertical: vertical || undefined,
          keyPoints: keyPoints || undefined,
        }),
      });

      if (response.status === 503) {
        setAiNotice(
          "AI briefs are turned off. Add your OPENAI_API_KEY to .env to enable them — you can still write the brief manually below.",
        );
        ensureBrief();
        return;
      }
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setAiNotice(payload?.error ?? "Couldn't generate a brief. Try again or write one manually.");
        ensureBrief();
        return;
      }

      const payload = (await response.json()) as { brief: GeneratedBrief };
      setBrief(payload.brief);
      setBriefGeneratedByAI(true);
      setAiNotice("Brief generated. Review and edit anything before you save.");
    } catch {
      setAiNotice("Network error while generating the brief. Please try again.");
      ensureBrief();
    } finally {
      setIsGenerating(false);
    }
  }

  const setText = (field: TextField, value: string) =>
    setBrief((prev) => (prev ? { ...prev, [field]: value } : prev));

  const setListItem = (field: ListField, index: number, value: string) =>
    setBrief((prev) => {
      if (!prev) return prev;
      const next = [...prev[field]];
      next[index] = value;
      return { ...prev, [field]: next };
    });

  const addListItem = (field: ListField) =>
    setBrief((prev) => {
      if (!prev || prev[field].length >= LIST_MAX_ITEMS) return prev;
      return { ...prev, [field]: [...prev[field], ""] };
    });

  const removeListItem = (field: ListField, index: number) =>
    setBrief((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: prev[field].filter((_, i) => i !== index) };
    });

  function cleanBriefForSubmit(source: BriefState) {
    const cleanList = (items: string[]) => items.map((i) => i.trim()).filter(Boolean);
    return {
      angle: source.angle.trim(),
      hook: source.hook.trim(),
      cta: source.cta.trim(),
      audience: source.audience.trim(),
      toneOfVoice: source.toneOfVoice.trim(),
      keyMessages: cleanList(source.keyMessages),
      doList: cleanList(source.doList),
      dontList: cleanList(source.dontList),
      proofPoints: cleanList(source.proofPoints),
    };
  }

  function briefIsComplete(cleaned: ReturnType<typeof cleanBriefForSubmit>): boolean {
    return Boolean(
      cleaned.angle &&
        cleaned.hook &&
        cleaned.cta &&
        cleaned.audience &&
        cleaned.toneOfVoice &&
        cleaned.keyMessages.length > 0,
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Give your campaign a name.");
      return;
    }

    let briefPayload: ReturnType<typeof cleanBriefForSubmit> | undefined;
    if (brief) {
      const cleaned = cleanBriefForSubmit(brief);
      if (briefIsComplete(cleaned)) {
        briefPayload = cleaned;
      } else if (briefGeneratedByAI || hasAnyBriefContent(cleaned)) {
        setFormError(
          "The brief is missing required parts (angle, hook, CTA, audience, tone, and at least one key message). Complete it or clear it before saving.",
        );
        return;
      }
    }

    startSubmit(async () => {
      const result = await createCampaign({
        name: name.trim(),
        objective: objective.trim() || undefined,
        vertical: vertical || undefined,
        budget: Number(budget) || 0,
        targetPostCount: Number(targetPostCount) || 0,
        icp: icp.trim() || undefined,
        brief: briefPayload,
        briefGeneratedByAI: briefPayload ? briefGeneratedByAI : undefined,
        briefPrompt:
          briefPayload && briefGeneratedByAI
            ? [productDescription, keyPoints].filter(Boolean).join("\n").slice(0, 4000)
            : undefined,
      });

      if (result.ok && result.campaignId) {
        router.push(`/app/campaigns/${result.campaignId}`);
      } else if (!result.ok) {
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
      {/* Campaign details */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign details</CardTitle>
            <CardDescription>The essentials. You can refine everything later.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Campaign name" htmlFor="name" required>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Q4 DevTools launch"
                required
                maxLength={140}
              />
            </Field>
            <Field label="Objective" htmlFor="objective">
              <Input
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Drive demo signups from platform engineers"
                maxLength={300}
              />
            </Field>
            <Field label="Vertical" htmlFor="vertical">
              <Select
                id="vertical"
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
              >
                <option value="">Select a vertical</option>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget (€)" htmlFor="budget">
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="5000"
                />
              </Field>
              <Field label="Target posts" htmlFor="targetPostCount">
                <Input
                  id="targetPostCount"
                  type="number"
                  min={0}
                  value={targetPostCount}
                  onChange={(e) => setTargetPostCount(e.target.value)}
                  placeholder="10"
                />
              </Field>
            </div>
            <Field label="Ideal customer profile (ICP)" htmlFor="icp" hint="Who are you trying to reach?">
              <Textarea
                id="icp"
                value={icp}
                onChange={(e) => setIcp(e.target.value)}
                placeholder="Senior platform & DevOps engineers at Series A–C B2B SaaS companies in Europe."
                maxLength={600}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      {/* AI brief generator */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-brand" />
                  AI brief generator
                </CardTitle>
                <CardDescription>
                  Describe your product and let AI draft a creator-ready brief. Everything stays editable.
                </CardDescription>
              </div>
              {briefGeneratedByAI && <Badge variant="brand">AI-drafted</Badge>}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product / company" htmlFor="productName">
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Acme Deploy"
                />
              </Field>
              <Field label="Target audience" htmlFor="targetAudience">
                <Input
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Platform engineers"
                />
              </Field>
            </div>
            <Field label="What does it do?" htmlFor="productDescription">
              <Textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Acme Deploy ships preview environments for every pull request in under 30 seconds…"
                maxLength={2000}
              />
            </Field>
            <Field label="Key points to emphasise (optional)" htmlFor="keyPoints">
              <Textarea
                id="keyPoints"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="SOC2 compliant, cuts CI costs 40%, loved by staff engineers"
                maxLength={2000}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="brand"
                onClick={generateBrief}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate brief with AI
                  </>
                )}
              </Button>
              {!brief && (
                <Button type="button" variant="outline" onClick={() => setBrief(EMPTY_BRIEF)}>
                  Write brief manually
                </Button>
              )}
            </div>

            {aiNotice && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground">
                {aiNotice}
              </div>
            )}

            {brief && (
              <BriefEditor
                brief={brief}
                onText={setText}
                onListItem={setListItem}
                onAddItem={addListItem}
                onRemoveItem={removeListItem}
                onClear={() => {
                  setBrief(null);
                  setBriefGeneratedByAI(false);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submit bar */}
      <div className="lg:col-span-5">
        {formError && (
          <p className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/app/campaigns")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create campaign"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function hasAnyBriefContent(cleaned: {
  angle: string;
  hook: string;
  cta: string;
  audience: string;
  toneOfVoice: string;
  keyMessages: string[];
  doList: string[];
  dontList: string[];
  proofPoints: string[];
}): boolean {
  return Boolean(
    cleaned.angle ||
      cleaned.hook ||
      cleaned.cta ||
      cleaned.audience ||
      cleaned.toneOfVoice ||
      cleaned.keyMessages.length ||
      cleaned.doList.length ||
      cleaned.dontList.length ||
      cleaned.proofPoints.length,
  );
}

// --- Editable brief card ----------------------------------------------------

function BriefEditor({
  brief,
  onText,
  onListItem,
  onAddItem,
  onRemoveItem,
  onClear,
}: {
  brief: BriefState;
  onText: (field: TextField, value: string) => void;
  onListItem: (field: ListField, index: number, value: string) => void;
  onAddItem: (field: ListField) => void;
  onRemoveItem: (field: ListField, index: number) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Campaign brief</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear brief
        </Button>
      </div>

      <div className="grid gap-4">
        <Field label="Angle" htmlFor="brief-angle">
          <Textarea
            id="brief-angle"
            value={brief.angle}
            onChange={(e) => onText("angle", e.target.value)}
            className="min-h-16 bg-white"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hook" htmlFor="brief-hook">
            <Textarea
              id="brief-hook"
              value={brief.hook}
              onChange={(e) => onText("hook", e.target.value)}
              className="min-h-16 bg-white"
            />
          </Field>
          <Field label="Call to action" htmlFor="brief-cta">
            <Textarea
              id="brief-cta"
              value={brief.cta}
              onChange={(e) => onText("cta", e.target.value)}
              className="min-h-16 bg-white"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Audience" htmlFor="brief-audience">
            <Input
              id="brief-audience"
              value={brief.audience}
              onChange={(e) => onText("audience", e.target.value)}
              className="bg-white"
            />
          </Field>
          <Field label="Tone of voice" htmlFor="brief-tone">
            <Input
              id="brief-tone"
              value={brief.toneOfVoice}
              onChange={(e) => onText("toneOfVoice", e.target.value)}
              className="bg-white"
            />
          </Field>
        </div>

        <ListEditor
          label="Key messages"
          field="keyMessages"
          items={brief.keyMessages}
          onListItem={onListItem}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ListEditor
            label="Do"
            field="doList"
            items={brief.doList}
            onListItem={onListItem}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
          />
          <ListEditor
            label="Don't"
            field="dontList"
            items={brief.dontList}
            onListItem={onListItem}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
          />
        </div>
        <ListEditor
          label="Proof points"
          field="proofPoints"
          items={brief.proofPoints}
          onListItem={onListItem}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />
      </div>
    </div>
  );
}

function ListEditor({
  label,
  field,
  items,
  onListItem,
  onAddItem,
  onRemoveItem,
}: {
  label: string;
  field: ListField;
  items: string[];
  onListItem: (field: ListField, index: number, value: string) => void;
  onAddItem: (field: ListField) => void;
  onRemoveItem: (field: ListField, index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <button
          type="button"
          onClick={() => onAddItem(field)}
          disabled={items.length >= LIST_MAX_ITEMS}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-700 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">No items yet.</p>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => onListItem(field, index, e.target.value)}
            className="bg-white"
            aria-label={`${label} item ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => onRemoveItem(field, index)}
            aria-label={`Remove ${label} item ${index + 1}`}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-danger"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
