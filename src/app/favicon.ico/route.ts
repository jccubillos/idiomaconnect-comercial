// Placeholder so Next doesn't 404 on /favicon.ico.
// Replace with a real /public/favicon.ico when branding is ready.
export const dynamic = "force-static";

export async function GET() {
  // 204 (y 304/205) NO pueden llevar cuerpo: debe ser `null`, no "".
  // Node/undici recientes rechazan un body en estos status y rompen el build.
  return new Response(null, { status: 204 });
}
