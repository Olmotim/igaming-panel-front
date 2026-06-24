interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`bg-card border-border text-foreground rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ colorScheme: "dark" }}
    >
      {children}
    </select>
  );
}
