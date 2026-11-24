export function PageHeader({ title, help }: { title: string; help?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {help && <p className="mt-1 text-muted-foreground">{help}</p>}
    </div>
  );
}
