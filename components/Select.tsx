interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, children, className = "", disabled = false }: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`text-sm px-3 py-2 rounded-md bg-card border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ colorScheme: "dark" }}
    >
      {children}
    </select>
  );
}