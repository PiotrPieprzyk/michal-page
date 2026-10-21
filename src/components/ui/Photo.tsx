import Image from "next/image";
import type { SiteImage } from "@/content/types";
import { hasImage, imageBaseUrl, objectPosition } from "@/lib/sanity-image";
import { Placeholder } from "./Placeholder";
import { cx } from "./cx";

/**
 * Fills its (relatively positioned) parent with the Sanity photo, or with the
 * striped placeholder while no photo has been uploaded.
 */
export function Photo({
  value,
  sizes,
  preload = false,
  tone = "neutral",
  withIcon = false,
  className,
  placeholderClassName,
  labelClassName,
}: {
  value: SiteImage;
  sizes: string;
  preload?: boolean;
  tone?: "neutral" | "before" | "after";
  withIcon?: boolean;
  className?: string;
  placeholderClassName?: string;
  labelClassName?: string;
}) {
  if (hasImage(value.image)) {
    return (
      <Image
        src={imageBaseUrl(value.image)}
        alt={value.alt}
        fill
        sizes={sizes}
        preload={preload}
        loading={preload ? undefined : "lazy"}
        className={cx("object-cover", className)}
        style={{ objectPosition: objectPosition(value.image) }}
      />
    );
  }
  return (
    <Placeholder
      label={value.placeholderLabel}
      tone={tone}
      withIcon={withIcon}
      className={cx("absolute inset-0", placeholderClassName)}
      labelClassName={labelClassName}
    />
  );
}
