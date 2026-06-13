interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}

export function Select({ value, onChange, children, className = "" }: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`text-sm px-3 py-2 rounded-md bg-card border border-border text-foreground ${className}`}
      style={{ colorScheme: "dark" }}
    >
      {children}
    </select>
  );
}