// Listings API
export async function GET() {
  return Response.json({ listings: [] })
}
export async function POST(req: Request) {
  return Response.json({ success: true })
}