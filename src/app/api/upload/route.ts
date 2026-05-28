import { auth } from "@/lib/auth";
import { CloudinaryProvider } from "@/lib/upload/cloudinaryProvider";

/** Server‑side upload handler that stores the file in Cloudinary */
export const POST = auth(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const folder = (formData.get("folder") as string) ?? undefined;
  const provider = new CloudinaryProvider();
  const result = await provider.upload(file, { folder });
  return new Response(JSON.stringify({ url: result.url, publicId: result.publicId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/** Delete an already‑uploaded asset from Cloudinary */
export const DELETE = auth(async (req) => {
  const { searchParams } = new URL(req.url);
  const publicId = searchParams.get("publicId");
  if (!publicId) {
    return new Response(JSON.stringify({ error: "publicId query param required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const provider = new CloudinaryProvider();
  await provider.delete(publicId);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
