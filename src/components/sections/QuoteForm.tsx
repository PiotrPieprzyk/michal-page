"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormContent, SiteSettings } from "@/content/types";
import { fill, plural, telHref } from "@/content/tokens";
import { buttonStyles, CallButton } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";
import { track } from "@/lib/analytics";
import { compressImage, formatSize, isAcceptedImage, MAX_BYTES, MAX_FILES } from "@/lib/image-compress";
import { submitQuote, UploadAborted, uploadFile, type UploadHandle } from "@/lib/upload";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type FileStatus = "compressing" | "queued" | "uploading" | "done" | "error";

interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number; // bytes actually uploaded (after compression)
  status: FileStatus;
  progress: number; // 0..1
  error?: string;
  /** Errors that retrying cannot fix (wrong type, too large). */
  permanent?: boolean;
  key?: string;
  preview?: string;
}

const isBusy = (s: FileStatus) => s === "compressing" || s === "queued" || s === "uploading";

/** Polish mobile/landline numbers: 9 digits, optionally +48; foreign numbers up to 15 digits. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[\s\-().]/g, "").replace(/^\+/, "").replace(/^00/, "");
  return /^\d{9,15}$/.test(digits);
}

let nextId = 0;

export function QuoteForm({ content, settings }: { content: FormContent; settings: SiteSettings }) {
  const f = useCallback((t: string, extra?: Record<string, string>) => fill(t, settings, extra), [settings]);
  const tel = telHref(settings.phone);
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    phone: `${uid}-phone`,
    phoneError: `${uid}-phone-error`,
    city: `${uid}-city`,
    desc: `${uid}-desc`,
    file: `${uid}-file`,
    fileMore: `${uid}-file-more`,
    limits: `${uid}-limits`,
    consent: `${uid}-consent`,
    consentError: `${uid}-consent-error`,
  };

  const [fields, setFields] = useState({ name: "", phone: "", city: "", description: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [notice, setNotice] = useState("");
  const [phase, setPhase] = useState<"form" | "submitting" | "sent">("form");
  const [submitError, setSubmitError] = useState("");
  const [token, setToken] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [sentPhotos, setSentPhotos] = useState<UploadItem[]>([]);

  const started = useRef(false);
  const startedAt = useRef(0);
  const handles = useRef(new Map<string, UploadHandle>());
  const turnstile = useRef<TurnstileInstance | undefined>(undefined);
  const phoneInput = useRef<HTMLInputElement>(null);
  const consentInput = useRef<HTMLInputElement>(null);
  const sentHeading = useRef<HTMLHeadingElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    startedAt.current = Date.now();
    track("form_started");
  };

  const patch = (id: string, change: Partial<UploadItem>) =>
    setFiles((list) => list.map((it) => (it.id === id ? { ...it, ...change } : it)));

  const fail = useCallback(
    (id: string, error: string, permanent = false) => {
      patch(id, { status: "error", error, permanent, progress: 0 });
      track("form_upload_error", { reason: permanent ? "validation" : "upload" });
    },
    [],
  );

  /** Compress + upload one file; uploads run one at a time (others show "W kolejce"). */
  const queue = useRef(Promise.resolve());
  const startUpload = useCallback(
    (item: UploadItem) => {
      patch(item.id, { status: "queued", error: undefined, progress: 0 });
      queue.current = queue.current.then(async () => {
        if (!filesRef.current.some((it) => it.id === item.id)) return; // removed meanwhile
        patch(item.id, { status: "compressing" });
        try {
          const out = await compressImage(item.file);
          if (out.blob.size > MAX_BYTES) {
            fail(item.id, f(content.errorTooLarge, { rozmiar: formatSize(item.file.size) }), true);
            return;
          }
          const preview = URL.createObjectURL(out.blob);
          patch(item.id, { status: "uploading", size: out.blob.size, preview });
          const handle = uploadFile(out.blob, out.name, out.type, (p) => patch(item.id, { progress: p }));
          handles.current.set(item.id, handle);
          const key = await handle.promise;
          patch(item.id, { status: "done", key, progress: 1 });
        } catch (e) {
          if (!(e instanceof UploadAborted)) fail(item.id, f(content.errorUpload));
        } finally {
          handles.current.delete(item.id);
        }
      });
      return queue.current;
    },
    [content.errorTooLarge, content.errorUpload, f, fail],
  );

  const addFiles = (list: FileList | File[]) => {
    markStarted();
    setNotice("");
    const incoming = Array.from(list);
    const room = MAX_FILES - filesRef.current.length;
    if (incoming.length > room) setNotice(f(content.errorTooMany));
    const accepted = incoming.slice(0, Math.max(0, room));
    const items: UploadItem[] = accepted.map((file) => ({
      id: `f${++nextId}`,
      file,
      name: file.name,
      size: file.size,
      status: "queued",
      progress: 0,
    }));
    setFiles((cur) => [...cur, ...items]);
    for (const item of items) {
      if (!isAcceptedImage(item.file)) {
        queueMicrotask(() => fail(item.id, f(content.errorBadType), true));
      } else if (item.file.size > MAX_BYTES && !/^image\/(jpeg|png|webp)$/.test(item.file.type)) {
        // Can't be compressed in the browser -> reject right away (HANDOFF example: 14 MB HEIC).
        queueMicrotask(() => fail(item.id, f(content.errorTooLarge, { rozmiar: formatSize(item.file.size) }), true));
      } else {
        void startUpload(item);
      }
    }
  };

  const removeFile = (id: string) => {
    handles.current.get(id)?.abort();
    setFiles((cur) => {
      const it = cur.find((x) => x.id === id);
      if (it?.preview) URL.revokeObjectURL(it.preview);
      return cur.filter((x) => x.id !== id);
    });
    setNotice("");
  };

  const retryFile = (id: string) => {
    const it = filesRef.current.find((x) => x.id === id);
    if (it) void startUpload(it);
  };

  useEffect(() => {
    const map = handles.current;
    return () => map.forEach((h) => h.abort());
  }, []);

  const uploading = files.some((it) => isBusy(it.status));
  const hasError = files.some((it) => it.status === "error");
  const done = files.filter((it) => it.status === "done");

  const validatePhone = () => {
    const ok = isValidPhone(fields.phone);
    setPhoneError(!ok);
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || phase === "submitting") return;
    markStarted();
    const phoneOk = validatePhone();
    setConsentError(!consent);
    if (!phoneOk) return phoneInput.current?.focus();
    if (!consent) return consentInput.current?.focus();
    if (TURNSTILE_SITE_KEY && !token) {
      setSubmitError(f(content.turnstileError));
      return;
    }

    setPhase("submitting");
    setSubmitError("");
    try {
      await submitQuote({
        ...fields,
        consent,
        photos: done.map((it) => ({ key: it.key!, name: it.name })),
        turnstileToken: token,
        elapsedMs: Date.now() - (startedAt.current || Date.now()),
      });
      track("form_submitted", { photos: done.length });
      setSentPhotos(done);
      setPhase("sent");
    } catch (err) {
      const code = (err as { code?: string }).code;
      setSubmitError(code === "turnstile" ? f(content.turnstileError) : f(content.errorSubmit));
      turnstile.current?.reset();
      setToken("");
      setPhase("form");
    }
  };

  useEffect(() => {
    if (phase === "sent") sentHeading.current?.focus();
  }, [phase]);

  const reset = () => {
    sentPhotos.forEach((it) => it.preview && URL.revokeObjectURL(it.preview));
    files.forEach((it) => it.preview && URL.revokeObjectURL(it.preview));
    setFields({ name: "", phone: "", city: "", description: "", website: "" });
    setConsent(false);
    setFiles([]);
    setSentPhotos([]);
    setNotice("");
    setSubmitError("");
    setPhoneError(false);
    setConsentError(false);
    setToken("");
    started.current = false;
    setPhase("form");
  };

  const input =
    "h-[52px] w-full rounded-[10px] border-[1.5px] border-input-border bg-white px-3.5 text-base text-ink outline-none focus-visible:border-forest-800 focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-forest-800";
  const fieldLabel = "text-[15px] font-bold";

  // ---------------- success panel ----------------
  const sentCount = sentPhotos.length;
  const photoWord = `${sentCount} ${plural(sentCount, content.photoWordOne, content.photoWordFew, content.photoWordMany)}`;

  const success = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3.5 pt-10 text-center lg:gap-4 lg:px-5 lg:pt-10">
        <div className="flex size-[84px] items-center justify-center rounded-full bg-forest-800 text-white lg:size-24">
          <Icon name="check" size={50} strokeWidth={2.6} className="size-11 lg:size-[50px]" />
        </div>
        <h3
          ref={sentHeading}
          tabIndex={-1}
          className="m-0 text-[28px] leading-[1.15] text-forest-900 outline-none lg:text-[34px]"
        >
          {f(content.sentHeading)}
        </h3>
        <p className="m-0 max-w-[440px] text-base leading-normal text-ink-2 lg:text-[17px]">
          {sentCount > 0 ? f(content.sentText, { liczba_zdjec: photoWord }) : f(content.sentTextNoPhotos)}{" "}
          <span className="lg:hidden">{f(content.sentNumberLabel)}</span>
        </p>
        <span className="text-[22px] font-extrabold text-forest-900 lg:hidden">{fields.phone}</span>
      </div>

      {sentCount > 0 && (
        <div className="flex flex-col gap-2.5 rounded-[12px] border border-line bg-beige-50 p-3.5 lg:items-center lg:border-0 lg:bg-transparent lg:p-0">
          <span className="text-[13px] font-bold tracking-[0.06em] text-ink-3 uppercase lg:sr-only">
            {f(content.sentPhotosHeading)}
          </span>
          <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 lg:flex lg:gap-2.5">
            {sentPhotos.map((it) => (
              <li key={it.id}>
                <Thumb item={it} className="h-[84px] w-full rounded-[8px] lg:size-24 lg:rounded-[10px]" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-center">
        <CallButton href={tel} track="form_sent" iconSize={20} className="h-14 px-6 text-[17px]">
          <span className="lg:hidden">{f(content.urgentLabelMobile)}</span>
          <span className="hidden lg:inline">{f(content.urgentLabelDesktop)}</span>
        </CallButton>
        <button
          type="button"
          onClick={reset}
          className={cx(buttonStyles.base, buttonStyles.outline, "h-[52px] cursor-pointer px-[22px] text-base lg:h-14")}
        >
          {f(content.resetLabel)}
        </button>
      </div>
    </div>
  );

  // ---------------- upload area ----------------
  const fileInput = (id: string) => (
    <input
      id={id}
      type="file"
      accept="image/*,.heic,.heif"
      multiple
      aria-describedby={ids.limits}
      className="peer sr-only"
      onChange={(e) => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );
  const focusRing = "peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-800 peer-focus-visible:outline-solid";

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
  };

  const readyText = plural(done.length, content.readyOne, content.readyFew, content.readyMany).replace(
    "{n}",
    String(done.length),
  );

  const uploadArea =
    files.length === 0 ? (
      <div
        {...dropHandlers}
        className={cx(
          "flex flex-col items-center gap-2.5 rounded-[12px] border-2 border-dashed border-input-border bg-beige-50 px-4 py-[22px] text-center lg:flex-row lg:gap-[18px] lg:p-6 lg:text-left",
          dragOver && "border-forest-800 bg-highlight",
        )}
      >
        <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-beige-200 text-forest-800 lg:size-14">
          <Icon name="camera" size={28} className="size-[26px] lg:size-7" />
        </div>
        <div className="flex flex-col gap-1 lg:flex-1">
          <span className="text-base font-extrabold text-forest-900">
            <span className="lg:hidden">{f(content.dropTitleMobile)}</span>
            <span className="hidden lg:inline">{f(content.dropTitleDesktop)}</span>
          </span>
          <span id={ids.limits} className="text-[13px] text-ink-3">
            <span className="lg:hidden">{f(content.limitsMobile)}</span>
            <span className="hidden lg:inline">{f(content.limitsDesktop)}</span>
          </span>
        </div>
        <div className="relative">
          {fileInput(ids.file)}
          <label
            htmlFor={ids.file}
            className={cx(
              "flex h-12 cursor-pointer items-center gap-2 rounded-[10px] bg-forest-800 px-5 text-[15px] font-bold whitespace-nowrap text-white hover:bg-forest-900",
              focusRing,
            )}
          >
            <span className="contents lg:hidden">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            {f(content.pickLabel)}
          </label>
        </div>
      </div>
    ) : (
      <div
        {...dropHandlers}
        className={cx(
          "flex flex-col gap-2.5 rounded-[12px] p-2.5 lg:p-3",
          hasError ? "border-2 border-error" : "border-[1.5px] border-line-strong",
          dragOver && "bg-highlight",
        )}
      >
        <span id={ids.limits} className="sr-only">
          {f(content.limitsDesktop)}
        </span>
        {!uploading && !hasError ? (
          // ready: thumbnails + "✓ 3 zdjęcia gotowe" + "+ Dodaj"
          <div className="flex flex-wrap items-center gap-2.5">
            <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
              {files.map((it) => (
                <li key={it.id} className="relative">
                  <Thumb item={it} className="size-[72px] rounded-[8px]" />
                  <button
                    type="button"
                    onClick={() => removeFile(it.id)}
                    aria-label={`${f(content.removeAria)}: ${it.name}`}
                    className="absolute -top-2 -right-2 flex size-7 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink-3 shadow-sm hover:text-error-text"
                  >
                    <Icon name="x" size={16} strokeWidth={2.4} />
                  </button>
                </li>
              ))}
            </ul>
            <span className="flex min-w-[140px] flex-1 items-center gap-1.5 text-sm font-bold text-forest-800">
              <Icon name="check" size={18} strokeWidth={2.6} />
              {readyText}
            </span>
            {files.length < MAX_FILES && (
              <div className="relative">
                {fileInput(ids.fileMore)}
                <label
                  htmlFor={ids.fileMore}
                  className={cx(
                    "flex h-12 cursor-pointer items-center rounded-[10px] border-[1.5px] border-forest-800 px-4 text-sm font-bold text-forest-800 hover:bg-beige-50",
                    focusRing,
                  )}
                >
                  {f(content.addMoreLabel)}
                </label>
              </div>
            )}
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {files.map((it) => (
              <FileRow
                key={it.id}
                item={it}
                content={content}
                f={f}
                onCancel={() => removeFile(it.id)}
                onRetry={() => retryFile(it.id)}
                onRemove={() => removeFile(it.id)}
              />
            ))}
          </ul>
        )}
      </div>
    );

  // ---------------- form ----------------
  const form = (
    <form noValidate onSubmit={onSubmit} onFocus={markStarted} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-2 lg:gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.name} className={fieldLabel}>
            {f(content.nameLabel)}
          </label>
          <input
            id={ids.name}
            type="text"
            name="name"
            autoComplete="given-name"
            maxLength={100}
            placeholder={f(content.namePlaceholder)}
            value={fields.name}
            onChange={(e) => setFields({ ...fields, name: e.target.value })}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.phone} className={fieldLabel}>
            {f(content.phoneLabel)} <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            ref={phoneInput}
            id={ids.phone}
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            maxLength={30}
            required
            aria-required="true"
            aria-invalid={phoneError || undefined}
            aria-describedby={phoneError ? ids.phoneError : undefined}
            placeholder={f(content.phonePlaceholder)}
            value={fields.phone}
            onChange={(e) => {
              setFields({ ...fields, phone: e.target.value });
              if (phoneError && isValidPhone(e.target.value)) setPhoneError(false);
            }}
            onBlur={() => fields.phone.trim() !== "" && validatePhone()}
            className={cx(input, phoneError && "border-2 border-error bg-error-bg")}
          />
          {phoneError && (
            <span id={ids.phoneError} className="flex items-center gap-1.5 text-sm font-semibold text-error">
              <Icon name="alert-circle" size={16} strokeWidth={2.4} />
              {f(content.phoneError)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.city} className={fieldLabel}>
          {f(content.cityLabel)}
        </label>
        <input
          id={ids.city}
          type="text"
          name="city"
          autoComplete="address-level2"
          maxLength={100}
          placeholder={f(content.cityPlaceholder)}
          value={fields.city}
          onChange={(e) => setFields({ ...fields, city: e.target.value })}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.desc} className={fieldLabel}>
          {f(content.descLabel)} <span className="font-normal text-ink-3">{f(content.optionalLabel)}</span>
        </label>
        <textarea
          id={ids.desc}
          name="description"
          rows={3}
          maxLength={2000}
          placeholder={f(content.descPlaceholder)}
          value={fields.description}
          onChange={(e) => setFields({ ...fields, description: e.target.value })}
          className={cx(input, "h-auto resize-y py-3 leading-[1.4]")}
        />
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>Strona www</label>
        <input
          id={`${uid}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(e) => setFields({ ...fields, website: e.target.value })}
        />
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
        <legend className={cx(fieldLabel, "mb-1.5 p-0")}>{f(content.photosLabel)}</legend>
        {uploadArea}
        {notice && (
          <p role="alert" className="m-0 text-sm font-semibold text-error">
            {notice}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <div className="flex min-h-11 items-start gap-2.5 text-[13px] leading-[1.45] text-ink-2 lg:text-sm">
          <input
            ref={consentInput}
            id={ids.consent}
            type="checkbox"
            required
            aria-required="true"
            aria-invalid={consentError || undefined}
            aria-describedby={consentError ? ids.consentError : undefined}
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setConsentError(false);
            }}
            className="m-0 size-[22px] shrink-0 cursor-pointer accent-forest-800"
          />
          <label htmlFor={ids.consent} className="cursor-pointer">
            {f(content.consentText)}{" "}
            <a href="/polityka-prywatnosci/" target="_blank" className="text-forest-800 underline">
              {f(content.consentLinkLabel)}
            </a>
            .
          </label>
        </div>
        {consentError && (
          <span id={ids.consentError} className="flex items-center gap-1.5 text-sm font-semibold text-error">
            <Icon name="alert-circle" size={16} strokeWidth={2.4} />
            {f(content.consentError)}
          </span>
        )}
      </div>

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstile}
          siteKey={TURNSTILE_SITE_KEY}
          options={{ language: "pl", appearance: "interaction-only", size: "flexible" }}
          onSuccess={setToken}
          onExpire={() => setToken("")}
          onError={() => setToken("")}
        />
      )}

      {submitError && (
        <p role="alert" className="m-0 rounded-[8px] bg-error-bg p-3 text-sm font-semibold text-error-text">
          {submitError}
        </p>
      )}

      {uploading || phase === "submitting" ? (
        <button
          type="submit"
          disabled
          className="flex h-14 items-center justify-center gap-2.5 rounded-[12px] border-0 bg-disabled text-base font-bold text-ink-3 lg:h-[60px] lg:text-[17px]"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
          </svg>
          {phase === "submitting" ? f(content.submittingLabel) : f(content.uploadingLabel)}
        </button>
      ) : (
        <button
          type="submit"
          className="h-14 cursor-pointer rounded-[12px] border-0 bg-accent text-lg font-extrabold text-ink hover:bg-[#ff7d36] lg:h-[60px] lg:text-[19px]"
        >
          {f(content.submitLabel)}
        </button>
      )}

      <a
        href={tel}
        data-call="form"
        className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-ink-2 no-underline lg:hidden"
      >
        {f(content.talkLabelMobile)}&nbsp;<strong className="text-forest-900">{settings.phone}</strong>
      </a>
    </form>
  );

  return (
    <section
      id="formularz"
      aria-labelledby="formularz-heading"
      className="bg-white pt-9 pb-8 lg:bg-forest-800 lg:py-24"
    >
      <div className="container-page grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_640px] xl:gap-20">
        {/* Intro: mobile heading/lead; desktop heading, steps, big phone */}
        <div className={cx("flex flex-col gap-2 lg:gap-7 lg:pt-4 lg:text-white", phase === "sent" && "max-lg:hidden")}>
          <div className="flex flex-col gap-2 lg:gap-3">
            <Eyebrow className="lg:text-beige-200">{f(content.eyebrow)}</Eyebrow>
            <h2
              id="formularz-heading"
              className="m-0 text-[30px] leading-[1.1] text-forest-900 lg:text-[52px] lg:leading-[1.04] lg:tracking-[-0.02em] lg:text-white"
            >
              <span className="lg:hidden">{f(content.headingMobile)}</span>
              <span className="hidden lg:inline">{f(content.headingDesktop)}</span>
            </h2>
            <p className="m-0 text-base leading-normal text-ink-2 lg:hidden">{f(content.leadMobile)}</p>
          </div>
          <ol className="m-0 hidden list-none flex-col gap-[18px] p-0 lg:flex">
            {content.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-beige-200 text-lg font-extrabold text-forest-900">
                  {i + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-lg">{f(step.title)}</strong>
                  <span className="text-base text-on-green">{f(step.text)}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="on-dark hidden flex-col gap-1 border-t border-forest-600 pt-6 lg:flex">
            <span className="text-[15px] text-beige-200">{f(content.talkLabelDesktop)}</span>
            <a href={tel} data-call="form" className="text-4xl font-extrabold text-white no-underline hover:text-beige-200">
              {settings.phone}
            </a>
          </div>
        </div>

        <div className="lg:rounded-[20px] lg:bg-white lg:p-9 lg:text-ink lg:shadow-form">
          <div role="status" aria-live="polite">
            {phase === "sent" && success}
          </div>
          {phase !== "sent" && form}
        </div>
      </div>
    </section>
  );
}

function Thumb({ item, className }: { item: UploadItem; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!item.preview || broken) {
    return <div aria-hidden="true" className={cx("stripes-before shrink-0", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local blob preview
    <img src={item.preview} alt="" onError={() => setBroken(true)} className={cx("shrink-0 object-cover", className)} />
  );
}

function FileRow({
  item,
  content,
  f,
  onCancel,
  onRetry,
  onRemove,
}: {
  item: UploadItem;
  content: FormContent;
  f: (t: string, extra?: Record<string, string>) => string;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  if (item.status === "error") {
    return (
      <li className="flex flex-col gap-2.5 rounded-[8px] bg-error-bg p-2.5 lg:flex-row lg:items-center lg:gap-3 lg:p-3">
        <div className="flex min-w-0 flex-1 gap-2.5 lg:items-center lg:gap-3">
          <Icon name="alert-circle" size={22} strokeWidth={2.2} className="shrink-0 text-error" />
          <div className="flex min-w-0 flex-col gap-0.5 text-sm leading-[1.4]">
            <span className="font-bold break-all">
              {item.name} {f(content.failedSuffix)}
            </span>
            <span className="text-error-text">{item.error}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0">
          {!item.permanent && (
            <button
              type="button"
              onClick={onRetry}
              className="h-11 cursor-pointer rounded-[8px] border-[1.5px] border-forest-800 bg-white px-3.5 text-sm font-bold whitespace-nowrap text-forest-800"
            >
              {f(content.retryLabel)}
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className={cx(
              "h-11 cursor-pointer border-0 bg-transparent px-2.5 text-sm font-bold whitespace-nowrap text-error-text underline",
              item.permanent && "col-span-2 justify-self-start",
            )}
          >
            {f(content.removeLabel)}
          </button>
        </div>
      </li>
    );
  }

  const pct = Math.round(item.progress * 100);
  let status: React.ReactNode;
  if (item.status === "done") status = <span className="font-bold text-forest-800">{f(content.statusDone)}</span>;
  else if (item.status === "uploading")
    status = (
      <span className="text-ink-2">
        {pct}% · {formatSize(item.size)}
      </span>
    );
  else if (item.status === "compressing") status = <span className="text-ink-3">{f(content.statusCompressing)}</span>;
  else status = <span className="text-ink-3">{f(content.statusQueued)}</span>;

  return (
    <li className="flex items-center gap-2.5 lg:gap-3">
      <Thumb item={item} className="size-12 rounded-[8px] lg:size-[52px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex justify-between gap-2 text-sm">
          <span className="truncate font-bold">{item.name}</span>
          <span className="shrink-0">{status}</span>
        </div>
        <div
          role="progressbar"
          aria-label={item.name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={item.status === "done" ? 100 : pct}
          className="h-1.5 overflow-hidden rounded-[3px] bg-track"
        >
          <div
            className="h-full bg-forest-800 transition-[width] duration-200"
            style={{ width: `${item.status === "done" ? 100 : pct}%` }}
          />
        </div>
      </div>
      {item.status === "done" ? (
        <span className="flex size-11 shrink-0 items-center justify-center text-forest-800">
          <Icon name="check" size={22} strokeWidth={2.6} />
          <span className="sr-only">{f(content.statusDone)}</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={onCancel}
          aria-label={`${f(content.cancelAria)}: ${item.name}`}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-ink-3 hover:text-error-text"
        >
          <Icon name="x" size={20} strokeWidth={2.2} />
        </button>
      )}
    </li>
  );
}
