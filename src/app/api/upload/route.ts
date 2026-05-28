import { uploadApi } from "next-cloudinary";
import { auth } from "@/lib/auth"; // using NextAuth handlers for session check

export const POST = auth(async (req) => {
  // uploadApi returns a handler that processes multipart/form-data
  const result = await uploadApi({
    folder: "laz-logos",
    // optional: transformation to limit size
    // transformation: [{ width: 500, crop: "limit" }],
  })(req);

  return new Response(JSON.stringify({ url: result.secure_url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
