import {
  CONTENT_PLATFORMS,
  PLATFORM_LABELS,
  PLATFORMS,
  STYLE_LABELS,
  STYLES,
  USE_FRAME_LABELS,
  USE_FRAMES
} from "@/lib/constants";
import { dateInputValue, deserializeLinks } from "@/lib/utils";

type CommonDefaults = {
  productName?: string | null;
  postPlatform?: string | null;
  angle?: string | null;
  deadlineAt?: Date | string | null;
  additionalNotes?: string | null;
};

type ContentDefaults = CommonDefaults & {
  videoAmount?: number | null;
  imageAmount?: number | null;
  useFrame?: string | null;
  hook?: string | null;
  rawOrReferenceLinks?: string | null;
};

type LpDefaults = CommonDefaults & {
  domainLpUrl?: string | null;
  style?: string | null;
  referenceLinks?: string | null;
};

function deadlineDefault(value?: Date | string | null, fallback = true) {
  if (value) return dateInputValue(value);
  return fallback ? dateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)) : "";
}

export function ContentRequestFields({
  defaults = {},
  useDeadlineFallback = true
}: {
  defaults?: ContentDefaults;
  useDeadlineFallback?: boolean;
}) {
  return (
    <>
      <input type="hidden" name="requestType" value="CONTENT" />
      <div className="field">
        <label>Nama produk</label>
        <input className="input" name="productName" required defaultValue={defaults.productName ?? ""} placeholder="Salep Varises" />
      </div>
      <div className="field">
        <label>Platform</label>
        <select className="select" name="postPlatform" required defaultValue={defaults.postPlatform ?? "META"}>
          {CONTENT_PLATFORMS.map((platform) => (
            <option value={platform} key={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Jumlah video</label>
        <input className="input" name="videoAmount" type="number" min="0" defaultValue={defaults.videoAmount ?? 1} required />
      </div>
      <div className="field">
        <label>Jumlah gambar</label>
        <input className="input" name="imageAmount" type="number" min="0" defaultValue={defaults.imageAmount ?? 0} required />
      </div>
      <div className="field">
        <label>Pakai frame</label>
        <select className="select" name="useFrame" required defaultValue={defaults.useFrame ?? "BEBAS_CREATOR"}>
          {USE_FRAMES.map((frame) => (
            <option value={frame} key={frame}>
              {USE_FRAME_LABELS[frame]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Deadline</label>
        <input className="input" name="deadlineAt" type="datetime-local" required defaultValue={deadlineDefault(defaults.deadlineAt, useDeadlineFallback)} />
      </div>
      <div className="field">
        <label>Angle</label>
        <input className="input" name="angle" defaultValue={defaults.angle ?? ""} />
      </div>
      <div className="field">
        <label>Hook</label>
        <input className="input" name="hook" defaultValue={defaults.hook ?? ""} />
      </div>
      <div className="field full">
        <label>Link mentahan/referensi</label>
        <textarea className="textarea" name="rawOrReferenceLinks" defaultValue={deserializeLinks(defaults.rawOrReferenceLinks).join("\n")} placeholder="Satu link per baris" />
      </div>
      <div className="field full">
        <label>Catatan tambahan</label>
        <textarea className="textarea" name="additionalNotes" defaultValue={defaults.additionalNotes ?? ""} />
      </div>
    </>
  );
}

export function LpRequestFields({
  defaults = {},
  useDeadlineFallback = true
}: {
  defaults?: LpDefaults;
  useDeadlineFallback?: boolean;
}) {
  return (
    <>
      <input type="hidden" name="requestType" value="LP" />
      <div className="field">
        <label>Nama produk</label>
        <input className="input" name="productName" required defaultValue={defaults.productName ?? ""} placeholder="Salep Varises" />
      </div>
      <div className="field">
        <label>Post di mana</label>
        <select className="select" name="postPlatform" required defaultValue={defaults.postPlatform ?? "WEBSITE"}>
          {PLATFORMS.map((platform) => (
            <option value={platform} key={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Domain/link LP</label>
        <input className="input" name="domainLpUrl" required defaultValue={defaults.domainLpUrl ?? ""} placeholder="https://..." />
      </div>
      <div className="field">
        <label>Style</label>
        <select className="select" name="style" required defaultValue={defaults.style ?? "HARDSELLING"}>
          {STYLES.map((style) => (
            <option value={style} key={style}>
              {STYLE_LABELS[style]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Deadline</label>
        <input className="input" name="deadlineAt" type="datetime-local" required defaultValue={deadlineDefault(defaults.deadlineAt, useDeadlineFallback)} />
      </div>
      <div className="field">
        <label>Angle</label>
        <input className="input" name="angle" defaultValue={defaults.angle ?? ""} placeholder="Kosongkan jika bebas creator" />
      </div>
      <div className="field full">
        <label>Reference links</label>
        <textarea className="textarea" name="referenceLinks" defaultValue={deserializeLinks(defaults.referenceLinks).join("\n")} placeholder="Satu link per baris" />
      </div>
      <div className="field full">
        <label>Catatan tambahan</label>
        <textarea className="textarea" name="additionalNotes" defaultValue={defaults.additionalNotes ?? ""} />
      </div>
    </>
  );
}
