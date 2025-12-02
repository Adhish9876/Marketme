// Messages API
export async function GET() {
  return Response.json({ messages: [] })
}
export async function POST(req: Request) {
  return Response.json({ success: true })
}