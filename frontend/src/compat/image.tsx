import type { CSSProperties, ImgHTMLAttributes } from "react";

/**
 * Shim next/image → <img>. Optimasi server-side Next hilang;
 * gambar Cloudinary tetap teroptimasi via transform params di URL.
 */
interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
}

export default function Image({
  fill,
  priority,
  quality: _quality,
  unoptimized: _unoptimized,
  style,
  loading,
  ...rest
}: ImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: (style?.objectFit as CSSProperties["objectFit"]) ?? "cover",
      }
    : undefined;

  return (
    <img
      {...rest}
      loading={loading ?? (priority ? "eager" : "lazy")}
      style={{ ...fillStyle, ...style }}
    />
  );
}
