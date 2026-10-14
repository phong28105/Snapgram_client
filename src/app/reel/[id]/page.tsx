export default function ReelPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Reel {params.id} — Coming soon</p>
    </main>
  );
}